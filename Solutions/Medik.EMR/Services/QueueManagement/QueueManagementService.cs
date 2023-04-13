using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using Medik.Core.Configuration;
using Medik.DalLayer;
using Medik.Enums;
using Medik.Security;
using Medik.ServerModel;
using Medik.ServerModel.Helpers;
using Microsoft.Extensions.Options;

namespace Medik.Services.QueueManagement
{
    public class QueueManagementService : IQueueManagementService
    {
        public QueueManagementDbContext queueManagementDbContext;
        public AppointmentDbContext appointmentDbContext;
        public string connStr;
        public QueueManagementService(IOptions<MyConfiguration> _config)
        {
            this.connStr = _config.Value.Connectionstring;
            queueManagementDbContext = new QueueManagementDbContext(connStr);
            appointmentDbContext = new AppointmentDbContext(connStr);
        }

        public dynamic GetDepartment()
        {
            var departmentdetails = queueManagementDbContext.Department.Where(x => x.IsAppointmentApplicable == true).ToList();
            return departmentdetails;
        }

        public dynamic GetAppointmentData(int deptId, int doctorId, bool pendingOnly)
        {
            //#21: Add appointment time from table pat_appointment 
            var visitVMList = (from visit in queueManagementDbContext.Visits
                               join appointment in queueManagementDbContext.Appointments on visit.AppointmentId equals appointment.AppointmentId
                               join department in queueManagementDbContext.Department on visit.DepartmentId equals department.DepartmentId
                               join patient in queueManagementDbContext.Patients on visit.PatientId equals patient.PatientId

                               //#21: after make VisitStatus & QueueStatus same we should retrive all the appt excluded the initiate status
                               where (
                                  visit.VisitStatus != "initiated"
                               && visit.VisitDate == DbFunctions.TruncateTime(System.DateTime.Now)
                               && visit.VisitType != ENUM_VisitType.inpatient
                               && visit.BillingStatus != ENUM_BillingStatus.returned
                               && (department.DepartmentId == deptId || deptId == 0)
                               && (visit.ProviderId == doctorId || doctorId == 0))
                               // where visit.Ins_HasInsurance == null
                               select new
                               {
                                   AppointmentDate = appointment.AppointmentDate,
                                   AppointmentTime = appointment.AppointmentTime,
                                   VisitTime = visit.VisitTime,
                                   PatientVisitId = visit.PatientVisitId,
                                   DepartmentId = department.DepartmentId,
                                   DepartmentName = department.DepartmentName,
                                   ProviderId = visit.ProviderId,
                                   ProviderName = visit.ProviderName,
                                   VisitDate = visit.VisitDate,
                                   QueueStatus = visit.QueueStatus,
                                   VisitStatus = visit.VisitStatus,
                                   VisitType = visit.VisitType,
                                   AppointmentId = visit.AppointmentId,
                                   AppointmentType = visit.AppointmentType,
                                   PatientId = patient.PatientId,
                                   PatientCode = patient.PatientCode,
                                   ShortName = patient.FirstName + " " + (string.IsNullOrEmpty(patient.MiddleName) ? "" : patient.MiddleName + " ") + patient.LastName,
                                   PhoneNumber = patient.PhoneNumber,
                                   DateOfBirth = patient.DateOfBirth,
                                   Gender = patient.Gender,
                                   QueueNo = visit.QueueNo,
                                   ConcludeDate = visit.ConcludeDate
                               }).OrderBy(v => v.QueueNo).AsQueryable();


            if (pendingOnly)
            {
                //#21:rename pending to arrive
                //return visitVMList.Where(a => a.QueueStatus == "pending" || a.QueueStatus == null).ToList();
                return visitVMList.Where(a => a.QueueStatus == "arrived" || a.QueueStatus == null).ToList();
            }
            else
            {
                return visitVMList.ToList();
            }
        }

        public dynamic updateQueueStatus(string data, int visitId, RbacUser currentUser)
        {
            //#21: VisitStatus and QueueStatus of new visit in table PAT_PatientVisits should be checkedin
            VisitModel visitModel = queueManagementDbContext.Visits.Where(a => a.PatientVisitId == visitId).FirstOrDefault();
            visitModel.VisitStatus = data;
            visitModel.QueueStatus = data;
            visitModel.ModifiedBy = currentUser.UserId;
            visitModel.ModifiedOn = DateTime.Now;
            queueManagementDbContext.Entry(visitModel).Property(a => a.ModifiedBy).IsModified = true;
            queueManagementDbContext.Entry(visitModel).Property(a => a.ModifiedOn).IsModified = true;
            queueManagementDbContext.Entry(visitModel).Property(a => a.QueueStatus).IsModified = true;
            queueManagementDbContext.SaveChanges();
            return visitModel;
        }


        public dynamic GetAllAppointmentApplicableDoctor()
        {
            var doctorList = queueManagementDbContext.Employees.Where(x => x.IsAppointmentApplicable == true).ToList();
            return doctorList;
        }
    }
}
