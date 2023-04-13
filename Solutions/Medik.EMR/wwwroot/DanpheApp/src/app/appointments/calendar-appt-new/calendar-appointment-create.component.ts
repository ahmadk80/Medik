import { Component, OnInit, Output,EventEmitter,Input,ChangeDetectorRef } from "@angular/core";
import { Router } from '@angular/router';
import { AppointmentService } from '../shared/appointment.service';
import { AppointmentBLService } from '../shared/appointment.bl.service';
import { SecurityService } from '../../security/shared/security.service';
import { Appointment } from "../shared/appointment.model";
import * as moment from 'moment/moment';//Parse, validate, manipulate, and display dates and times in JS.
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { PatientService } from "../../patients/shared/patient.service";
import { CallbackService } from '../../shared/callback.service';
import { RouteFromService } from '../../shared/routefrom.service';
import { Patient } from "../../patients/shared/patient.model";
import GridColumnSettings from "../../shared/danphe-grid/grid-column-settings.constant";
import { GridEmitModel } from "../../shared/danphe-grid/grid-emit.model";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { CoreBLService } from "../../core/shared/core.bl.service";
import { APIsByType } from "../../shared/search.service";
import { VisitService } from "../shared/visit.service";
import { VisitBLService } from "../shared/visit.bl.service";
import { Department } from "../../settings-new/shared/department.model";
import { CoreService } from "../../core/shared/core.service";
import { CalendarComponent } from "../calendar/calendar.component";
import { AppointmentVisitType } from "../shared/appointment-visit-type.model";
//import { EventEmitter } from "events";

@Component({
  selector:"app-booking-appointment",
  templateUrl: "./calendar-create-appointment.html", //"/AppointmentView/CreateAppointment" 
  host:{'(window:keydown)':'hotkeys($event)'}
})


//
export class CalendarAppointmentCreateComponent {
  public CurrentAppointment: Appointment = new Appointment();
  public patients: Array<Patient> = new Array<Patient>();
  AppointmentpatientGridColumns: Array<any> = null;
  public showApptPanel: boolean = false;
  //no change
  public Update: boolean = false;
  public departmentId: number = 0;
  public patientId: number = 0;
  public doctorList: Array<{ DepartmentId: number, DepartmentName: string, ProviderId: number, ProviderName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }> = [];
  public filteredDocList: Array<{ DepartmentId: number, DepartmentName: string, ProviderId: number, ProviderName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }>;
  public departmentList: Array<Department>;
  public AppointmentVisitTypList: Array<AppointmentVisitType>;
  public filteredAppointmentVisitTypList: Array<AppointmentVisitType>;
  public selectedDepartment: any = null;
  public selectedDoctor: any = null;
  public selectedPatient: any = null;
  public selectedVisitType: any = null;
  public enablePreview: boolean = false;
  public aptList: Array<Appointment> = new Array<Appointment>();
  public aptListafterTime: Array<any> = null;
  public aptListbeforeTime: Array<any> = null;
  public Patient: Patient;
  //declare boolean loading variable for disable the double click event of button
  loading: boolean = false;
  ///this is used to check provider
  public checkProvider: boolean = false;

  department: Array<any> = new Array<any>();
  public patGirdDataApi: string = "";
  searchText: string = '';
  public enableServerSideSearch: boolean = false;

  @Output('app-bookpat-callback')
  public appEmiter: EventEmitter<string> = new EventEmitter<string>();

  @Input('appt-to-add')
  public AppointmentToAdd: Appointment = new Appointment();

  @Input('appt-to-update')
  public AppointmentToUpdate: Appointment = new Appointment();

  constructor(public appointmentBLService: AppointmentBLService, public calendar:CalendarComponent,
    public appointmentService: AppointmentService,
    public callbackservice: CallbackService,
    public securityService: SecurityService,
    public router: Router,
    public msgBoxServ: MessageboxService,
    public patientService: PatientService,
    public routeFromService: RouteFromService,
    public coreBlService: CoreBLService,
    public visitService: VisitService,
    public visitBLService: VisitBLService,
    public coreService: CoreService, public changeDetectorRef: ChangeDetectorRef) {  }
  
  ngOnInit() {
      this.getAppointmentVisitType();
      this.getDepts();
      this.getDocts();
      this.LoadPatients("");
        this.AssignEditableData();
  }

  AssignEditableData() {
    this.Update=false;
      if(this.AppointmentToUpdate.AppointmentId!=0){
        this.Update=true;
        this.selectedDepartment = this.visitService.ApptApplicableDepartmentList.find(a => a.DepartmentId == this.AppointmentToUpdate.DepartmentId);
        this.selectedDoctor = this.visitService.ApptApplicableDoctorsList.find(a => a.ProviderId == this.AppointmentToUpdate.ProviderId);
        this.selectedVisitType = this.visitService.ApptVisitTypesList.find(a => a.AppointmentVisitTypeId == this.AppointmentToUpdate.AppointmentVisitTypeId);
        Object.assign(this.CurrentAppointment,this.AppointmentToUpdate);
        let parsedDate = moment(this.AppointmentToUpdate.AppointmentDate).format('YYYY-MM-DD');
        let startParsedTime = moment(this.AppointmentToUpdate.AppointmentTime).format('HH:mm');
        let endParsedTime = moment(this.AppointmentToUpdate.AppointmentEndTime).format('HH:mm');
        this.CurrentAppointment.AppointmentDate = parsedDate;
        this.CurrentAppointment.AppointmentTime = startParsedTime;
        this.CurrentAppointment.AppointmentEndTime = endParsedTime;
      }else
      {
        this.Update=false;
        this.CurrentAppointment.PatientId = this.AppointmentToAdd.PatientId;
        this.CurrentAppointment.FirstName = this.AppointmentToAdd.FirstName;
        this.CurrentAppointment.MiddleName = this.AppointmentToAdd.MiddleName;
        this.CurrentAppointment.LastName = this.AppointmentToAdd.LastName;
        this.CurrentAppointment.Gender = this.AppointmentToAdd.Gender;
        this.CurrentAppointment.AppointmentVisitTypeId = this.AppointmentToAdd.AppointmentVisitTypeId;
        this.CurrentAppointment.AppointmentVisitTypeName = this.AppointmentToAdd.AppointmentVisitTypeName;
        this.CurrentAppointment.ContactNumber = this.AppointmentToAdd.ContactNumber;
        let parsedDate = moment(this.AppointmentToAdd.AppointmentDate).format('YYYY-MM-DD');
        let parsedTime = moment(this.AppointmentToAdd.AppointmentTime).format('HH:mm');
        let endParsedTime = moment(this.AppointmentToAdd.AppointmentEndTime).format('HH:mm');
        this.CurrentAppointment.AppointmentDate = parsedDate;
        this.CurrentAppointment.AppointmentTime = parsedTime;
        this.CurrentAppointment.AppointmentEndTime = endParsedTime;
      }
  }

  ngAfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }
  
  GetVisitDoctors() {
    this.enablePreview = true;
    this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
  }

  public GetAppointmentList() {
    let providerId = this.selectedDoctor ? this.selectedDoctor.ProviderId : null;
    if (providerId) {
      this.appointmentBLService.GetAppointmentProviderList(providerId, this.CurrentAppointment.AppointmentDate)
        .subscribe(res => {
          if (res.Status == 'OK') {
            this.aptList = res.Results;
            this.aptListbeforeTime = this.aptList;
            var Time;
            for (var i = 0; i < this.aptListbeforeTime.length; i++) {
              let HHmmss = this.aptListbeforeTime[i].AppointmentTime.split(':');
              let appTimeHHmm = "";
              if (HHmmss.length > 1) {
                //add hours and then minute to 00:00 and then format to 12hrs hh:mm AM/PM format. 
                //using 00:00:00 time so that time part won't have any impact after adding.
                appTimeHHmm = moment("2017-01-01 00:00:00").add(HHmmss[0], 'hours').add(HHmmss[1], 'minutes').format('hh:mm A');
                this.aptListbeforeTime[i].AppointmentTime = appTimeHHmm;
              }
              this.aptListafterTime = this.aptListbeforeTime;
            }
            this.CurrentAppointment.AppointmentList = res.Results;
            if (this.Update && this.CurrentAppointment.AppointmentList.length > 0) {
              this.CurrentAppointment.AppointmentList = this.CurrentAppointment.AppointmentList.filter(a => a.AppointmentTime != this.CurrentAppointment.AppointmentTime);
              this.aptList = this.CurrentAppointment.AppointmentList;
            }
          }
          else {
            this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
          }
        },
          err => {
            this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
          });
    } else {
      this.aptList = new Array<Appointment>();
    }
  }

  ConditionalValidationOfAgeAndDOB() {
    if (this.CurrentAppointment.IsDobVerified == true) {
      //incase age was entered
      this.CurrentAppointment.Age = null;
      let onOff = 'off';
      let formControlName = 'Age';
      this.CurrentAppointment.UpdateValidator(onOff, formControlName);
    }
    else {
      let onOff = 'on';
      let formControlName = 'Age';
      this.CurrentAppointment.UpdateValidator(onOff, formControlName);

    }
  }

  LoadPatients(searchTxt): void {
    this.appointmentBLService.GetPatients(searchTxt)
      .subscribe(res => {
        if (res.Status == 'OK') {
          this.patients = res.Results;
          this.GetVisitDoctors();
        }
        else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage("error", ["failed to get  patients"] + err);
        });
  }
  //common function to set focus on  given Element. 
  setFocusById(targetId: string, waitingTimeinMS: number = 10) {
    this.coreService.FocusInputById(targetId);
  }

  getAppointmentVisitType() {
    this.appointmentBLService.getAppointmentVisitTypes()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this.visitService.ApptVisitTypesList = res.Results;
        }
      });
  }

  getDepts() {
    this.visitBLService.GetDepartment()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this.visitService.ApptApplicableDepartmentList = res.Results;
          this.visitService.ApptApplicableDepartmentList = this.coreService.Masters.Departments.filter(d => d.IsAppointmentApplicable == true && d.IsActive == true).map(d => {
            return {
              DepartmentId: d.DepartmentId,
              DepartmentName: d.DepartmentName
            };
          });
        }

      });
  }

  getDocts() {
    this.visitBLService.GetVisitDoctors()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this.visitService.ApptApplicableDoctorsList = res.Results;
        }
      });
  }

  public AssignSelectedPatient() {
    let patient = null;
    if (this.selectedPatient == "") {
      this.CurrentAppointment.IsValidSelPatient = true;
      this.patientId = 0;
      this.CurrentAppointment.PatientId = null;
      this.CurrentAppointment.FirstName = "";
      this.CurrentAppointment.MiddleName = "";
      this.CurrentAppointment.LastName = "";
      this.CurrentAppointment.Age = null;
      this.CurrentAppointment.ContactNumber = null;
      this.CurrentAppointment.Gender = null;
      //this.filteredDocList = this.doctorList;
      return;
    }
    if (this.selectedPatient && this.patients && this.patients.length) {
      if (typeof (this.selectedPatient) == 'string') {
        patient = this.patients.find(a => a.ShortName.toLowerCase() == String(this.selectedPatient).toLowerCase());

      }
      else if (typeof (this.selectedPatient) == 'object' && this.selectedPatient.PatientId){
        patient = this.patients.find(a => a.PatientId == this.selectedPatient.PatientId);
      }
      if (patient) {
        
        this.selectedPatient = Object.assign(this.selectedPatient, patient);
        this.patientId = patient.patientId;
        this.CurrentAppointment.IsValidSelPatient = true;
        this.CurrentAppointment.PatientId = patient.PatientId;
        this.CurrentAppointment.FirstName = patient.FirstName;
        this.CurrentAppointment.MiddleName = patient.MiddleName;
        this.CurrentAppointment.LastName = patient.LastName;
        this.CurrentAppointment.FullName = patient.FullName;
        this.CurrentAppointment.Age = patient.Age.slice(0, -1);
        this.CurrentAppointment.AgeUnit = patient.Age.slice(patient.Age.length - 1); 
        this.CurrentAppointment.ContactNumber = patient.PhoneNumber;
        this.CurrentAppointment.Gender = patient.Gender;

      }
      else {
        this.CurrentAppointment.IsValidSelPatient = false;
      }
    }
    else {
      this.patientId = 0;
      this.CurrentAppointment.PatientId = null;
      this.CurrentAppointment.FirstName = null;
      this.CurrentAppointment.MiddleName = null;
      this.CurrentAppointment.LastName = null;
      this.CurrentAppointment.Age = null;
      this.CurrentAppointment.ContactNumber =null;
      this.CurrentAppointment.Gender = null;
    }
    this.CurrentAppointment.IsValidTime();
  }

  public AssignSelectedDepartment() {
    this.departmentList = this.visitService.ApptApplicableDepartmentList;
    let department = null;
    this.selectedDoctor = "";
    if (this.selectedDepartment == "") {
      this.CurrentAppointment.IsValidSelDepartment = true;
      this.departmentId = 0;
      this.CurrentAppointment.DepartmentId = null;
      this.CurrentAppointment.DepartmentName = "";
      this.CurrentAppointment.ProviderId = null;
      this.CurrentAppointment.ProviderName = "";
      //this.filteredDocList = this.doctorList;
      return;
    }
    if (this.selectedDepartment && this.departmentList && this.departmentList.length) {
      if (typeof (this.selectedDepartment) == 'string') {
        department = this.departmentList.find(a => a.DepartmentName.toLowerCase() == String(this.selectedDepartment).toLowerCase());

      }
      else if (typeof (this.selectedDepartment) == 'object' && this.selectedDepartment.DepartmentId)
        department = this.departmentList.find(a => a.DepartmentId == this.selectedDepartment.DepartmentId);
      if (department) {

        this.selectedDepartment = Object.assign(this.selectedDepartment, department);
        this.departmentId = department.DepartmentId;
        this.CurrentAppointment.IsValidSelDepartment = true;
        this.CurrentAppointment.DepartmentId = department.DepartmentId;
        this.CurrentAppointment.DepartmentName = department.DepartmentName;
        this.selectedDoctor = null;
        this.selectedVisitType=null;
        this.filteredDocList = this.doctorList.filter(doc => doc.DepartmentId == this.departmentId);
        this.FilterDoctorList();
      }
      else {
        this.CurrentAppointment.IsValidSelDepartment = false;
      }
    }
    else {
      this.departmentId = 0;
      this.CurrentAppointment.DepartmentId = null;
      this.CurrentAppointment.DepartmentName = null;
      //this.filteredDocList = this.doctorList;
    }
    //this.GetAppointmentDepartmentList();
    this.CurrentAppointment.IsValidTime();
  }

  public AssignSelectedVisitType() { 
    this.filteredAppointmentVisitTypList;
    let apptVisitType=null;
    if (this.selectedVisitType == "" || this.selectedVisitType == undefined) {
      this.filteredAppointmentVisitTypList=this.AppointmentVisitTypList =  this.visitService.ApptVisitTypesList;     
      this.CurrentAppointment.IsValidSelVisitType = true;

      if (this.CurrentAppointment.DepartmentId == null) {
        this.departmentList = this.visitService.ApptApplicableDepartmentList;
        this.filteredAppointmentVisitTypList = this.AppointmentVisitTypList = this.visitService.ApptVisitTypesList;
      }
      if (this.CurrentAppointment.DepartmentId != null) {
        this.filteredAppointmentVisitTypList=this.AppointmentVisitTypList =  this.visitService.ApptVisitTypesList;     
        this.filteredAppointmentVisitTypList = this.AppointmentVisitTypList.filter(doc => doc.DepartmentId == this.CurrentAppointment.DepartmentId);
      }
      this.CurrentAppointment.AppointmentVisitTypeId = null;
      this.CurrentAppointment.AppointmentVisitTypeName = null;
      return;
    }

    if (this.selectedVisitType && this.AppointmentVisitTypList && this.AppointmentVisitTypList.length) {
      if (typeof (this.selectedVisitType) == 'string') {
        apptVisitType = this.AppointmentVisitTypList.find(a => a.AppointmentVisitTypeName.toLowerCase() == String(this.selectedVisitType).toLowerCase());
      }
      else if (typeof (this.selectedVisitType) == 'object' && this.selectedVisitType.AppointmentVisitTypeId)
      apptVisitType = this.AppointmentVisitTypList.find(a => a.AppointmentVisitTypeName == this.selectedVisitType.AppointmentVisitTypeName);
      if (apptVisitType) {
        this.selectedVisitType = Object.assign(this.selectedVisitType, apptVisitType);
        this.filteredAppointmentVisitTypList = this.AppointmentVisitTypList.filter(doc => doc.DepartmentId == apptVisitType.departmentId);
        this.CurrentAppointment.IsValidSelVisitType = true;
        this.CurrentAppointment.AppointmentVisitTypeId = apptVisitType.AppointmentVisitTypeId;
        this.CurrentAppointment.AppointmentVisitTypeName = apptVisitType.AppointmentVisitTypeName;
        this.CurrentAppointment.AppointmentEndTime=this.CalculateApptEndTime();
      }else{ 
        this.CurrentAppointment.IsValidSelVisitType = false;
       }
    }
   
  }

  CalculateApptEndTime():string{
    let apptStartDateTime=new Date(this.CurrentAppointment.AppointmentDate.substring(0,10)+"T"+this.CurrentAppointment.AppointmentTime)
    let apptEndDateTime=new Date(apptStartDateTime)
    apptEndDateTime.setMinutes(apptStartDateTime.getMinutes()+this.selectedVisitType.AppointmentVisitTypeLength)
    return moment(apptEndDateTime).format('HH:mm');
  }
  public AssignSelectedDoctor() {
    this.filteredDocList;
    let doctor = null;
    if (this.selectedDoctor == "" || this.selectedDoctor == undefined) {
      this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
      this.aptList = new Array<Appointment>();
      this.CurrentAppointment.IsValidSelProvider = true;

      if (this.CurrentAppointment.DepartmentId == null) {
        this.departmentList = this.visitService.ApptApplicableDepartmentList;
        this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
      }
      if (this.CurrentAppointment.DepartmentId != null) {
        this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
        this.filteredDocList = this.doctorList.filter(doc => doc.DepartmentId == this.CurrentAppointment.DepartmentId);
      }
      this.CurrentAppointment.ProviderId = null;
      this.CurrentAppointment.ProviderName = null;

      return;
    }

    if (this.selectedDoctor && this.doctorList && this.doctorList.length) {
      if (typeof (this.selectedDoctor) == 'string') {
        doctor = this.doctorList.find(a => a.ProviderName.toLowerCase() == String(this.selectedDoctor).toLowerCase());
      }
      else if (typeof (this.selectedDoctor) == 'object' && this.selectedDoctor.ProviderId)
        doctor = this.doctorList.find(a => a.ProviderId == this.selectedDoctor.ProviderId);
      if (doctor) {
        this.departmentId = doctor.DepartmentId;
        this.selectedDepartment = doctor.DepartmentName;
        this.filteredDocList = this.doctorList.filter(doc => doc.DepartmentId == this.departmentId);
        this.selectedDoctor = Object.assign(this.selectedDoctor, doctor);
        this.CurrentAppointment.ProviderId = doctor.ProviderId;//this will give providerid
        this.CurrentAppointment.ProviderName = doctor.ProviderName;
        this.CurrentAppointment.IsValidSelProvider = true;
        this.CurrentAppointment.IsValidSelDepartment = true;
        this.CurrentAppointment.DepartmentId = doctor.DepartmentId;
      }
      else {
        this.CurrentAppointment.IsValidSelProvider = false;
      }
    }
    else {
      this.CurrentAppointment.ProviderId = null;
      this.CurrentAppointment.ProviderName = null;
      this.AssignSelectedDepartment();//sud:19June'19-- If doctor is not proper then assign bill items that of Department level.
    }
    this.GetAppointmentList();
    this.CurrentAppointment.IsValidTime();
  }

  FilterDoctorList() {

    //    if (this.selectedDoctor != null || this.selectedDoctor != 0) {
    //    if (typeof (this.selectedDoctor) == 'object' || this.selectedDoctor == 0 || this.selectedDoctor == "" ) {
    //    //this.selectedDoctor.ProviderName = null;
    //    this.selectedDoctor.ProviderId = 0;
    //  }
    //}
    if (this.departmentId && Number(this.departmentId) != 0) {
      this.filteredDocList = this.doctorList.filter(doc => doc.DepartmentId == this.departmentId);

    }
    else {
      this.filteredDocList = this.doctorList;
    }
  }

  AddTelephoneAppointment() {
    //for checking validations, marking all the fields as dirty and checking the validity.
    for (var i in this.CurrentAppointment.AppointmentValidator.controls) {     
      this.CurrentAppointment.AppointmentValidator.controls[i].markAsDirty();
      this.CurrentAppointment.AppointmentValidator.controls[i].updateValueAndValidity();
    }
    if (this.CurrentAppointment.IsValidCheck(undefined, undefined)       
      && this.CurrentAppointment.IsValidSelDepartment
      && this.CurrentAppointment.IsValidSelProvider
      && this.CurrentAppointment.IsValidSelVisitType) {
      //removing extra spaces typed by the users
      this.CurrentAppointment.FirstName = this.CurrentAppointment.FirstName.trim();
      this.CurrentAppointment.MiddleName = this.CurrentAppointment.MiddleName ? this.CurrentAppointment.MiddleName.trim() : null;
      this.CurrentAppointment.LastName = this.CurrentAppointment.LastName.trim();

      this.loading = true;
      this.CurrentAppointment.AppointmentType = "New";
      this.CurrentAppointment.AppointmentStatus = "Initiated"

      this.CurrentAppointment.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      this.CurrentAppointment.CreatedOn = moment().format('YYYY-MM-DD HH:mm:ss');
      this.appointmentBLService.CheckForClashingAppointment(this.CurrentAppointment.PatientId, this.CurrentAppointment.AppointmentDate, this.CurrentAppointment.ProviderId,this.CurrentAppointment.AppointmentId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status == "OK") {
            let isClashingAppointment: boolean = res.Results;

            if (isClashingAppointment) {
              this.loading = false;
              this.msgBoxServ.showMessage("failed", ['This patient already has appointment / visit with ' + this.CurrentAppointment.ProviderName + ' on ' + this.CurrentAppointment.AppointmentDate]);
            }
            else {
              this.appointmentBLService.AddAppointment(this.CurrentAppointment)
                .subscribe((res: DanpheHTTPResponse) => {
                  if (res.Status == "OK") {
                    this.loading = false;
                    this.selectedDoctor = null;
                    this.selectedDepartment = null;
                    this.selectedVisitType = null;
                    this.showApptPanel = false;
                    this.msgBoxServ.showMessage("success", ['Your Appointment is Created. Your AppointmentID is ' + res.Results.AppointmentId]);
                    this.calendar.LoadAppointments();
                    this.Close();
                  } else { this.msgBoxServ.showMessage("failed", ['Failed!! Cannot create appointment.']); }
                },
                  err => {
                    this.msgBoxServ.showMessage("failes", [err.ErrorMessage]);
                  });
              this.loading = false;
            }

          }
          else {
            this.appointmentBLService.AddAppointment(this.CurrentAppointment)
              .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status == "OK") {
                  this.loading = false;
                  this.showApptPanel = false;
                  this.selectedDoctor = null;
                  this.selectedDepartment = null;
                  this.selectedVisitType = null;
                  this.msgBoxServ.showMessage("success", ['Your Appointment is Created. Your AppointmentID is ' + res.Results.AppointmentId]);
                  this.calendar.LoadAppointments();
                  this.Close();

                } else { this.msgBoxServ.showMessage("failed", ['Failed!! Cannot create appointment.']); }
              },
                err => {
                  this.msgBoxServ.showMessage("failed", [err.ErrorMessage]);
                });
            this.loading = false;
          }
        });
    }
    else {
      this.msgBoxServ.showMessage("failed", ['Failed!! Cannot create appointment. Check the Details Correctly.']);
    }
  }

  UpdateTelephoneAppointment() {
    for (var i in this.CurrentAppointment.AppointmentValidator.controls) {
      this.CurrentAppointment.AppointmentValidator.controls[i].markAsDirty();
      this.CurrentAppointment.AppointmentValidator.controls[i].updateValueAndValidity();
      
    }
    if (this.CurrentAppointment.IsValidCheck(undefined, undefined)
      && this.CurrentAppointment.IsValidSelDepartment
      && this.CurrentAppointment.IsValidSelProvider
      && this.CurrentAppointment.IsValidSelVisitType
      ) {
      this.appointmentBLService.CheckForClashingAppointment(this.CurrentAppointment.PatientId, this.CurrentAppointment.AppointmentDate, this.CurrentAppointment.ProviderId,this.CurrentAppointment.AppointmentId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status == "OK") {
            let isClashingAppointment: boolean = res.Results;

            if (isClashingAppointment) {
              this.loading = false;
              this.msgBoxServ.showMessage("failed", ['This patient already has appointment / visit with ' + this.CurrentAppointment.ProviderName + ' on ' + this.CurrentAppointment.AppointmentDate]);
            }
            else {
              this.appointmentBLService.PutAppointment(this.CurrentAppointment)
                .subscribe(res => {
                  if (res.Status == 'OK') {
                    this.patients = res.Results;
                    this.calendar.LoadAppointments();
                    this.showApptPanel = false;
                    this.msgBoxServ.showMessage("success", ['Your Appointment updated.']);                    
                    this.Close();
                    
                  }
                  else {
                    this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
                  }
                },
                  err => {
                    this.msgBoxServ.showMessage("error", ["failed to update appointment"] + err);
                  });
              this.loading = false;
            }
          }
        });
    }
    else { this.msgBoxServ.showMessage("Failed", ["Please fill the form properly."]); }


  }

  CancelTelephoneAppointment() {
    console.log("Cancel started")
    this.CurrentAppointment.AppointmentStatus="canceled"
    this.appointmentBLService.UpdateAppointmentStatus(this.CurrentAppointment)
      .subscribe(res => {
        if (res.Status == 'OK') {
         
          this.patients = res.Results;
          this.calendar.LoadAppointments();
          this.showApptPanel = false;
          this.msgBoxServ.showMessage("success", ['Your Appointment canceled.']);                    
          this.Close();

        }
        else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage("error", ["failed to update appointment"] + err);
        });
    this.loading = false;
  }

  AppointmentPatientGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      //checkin is 'add visit'--for reference
      case "create":
        {
          this.CurrentAppointment = new Appointment();

          this.CurrentAppointment.PatientId = $event.Data.PatientId;
          this.CurrentAppointment.FirstName = $event.Data.FirstName;
          this.CurrentAppointment.MiddleName = $event.Data.MiddleName;
          this.CurrentAppointment.LastName = $event.Data.LastName;
          this.CurrentAppointment.Gender = $event.Data.Gender;
          this.CurrentAppointment.Age = $event.Data.Age.slice(0, -1);
          this.CurrentAppointment.ContactNumber = $event.Data.PhoneNumber;
          this.CurrentAppointment.AppointmentDate = moment().format('YYYY-MM-DD');
          this.CurrentAppointment.AppointmentTime = moment().format('HH:mm:ss');
          this.selectedDoctor = null;
          this.departmentId = 0;

          //disabling controls for registered patients
          this.CurrentAppointment.AppointmentValidator.controls['FirstName'].disable();
          this.CurrentAppointment.AppointmentValidator.controls['MiddleName'].disable();
          this.CurrentAppointment.AppointmentValidator.controls['LastName'].disable();
          this.CurrentAppointment.AppointmentValidator.controls['Gender'].disable();
          this.aptList = new Array<Appointment>();

          this.showApptPanel = false;
        }
        break;

      default:
        break;
    }
  }

  myPatienttListFormatter(data: any): string {
    let html = data["FullName"];
    return html;
  }

  myDepartmentListFormatter(data: any): string {
    let html = data["DepartmentName"];
    return html;
  }

  myAppointmentVisitTypListFormatter(data: any): string {
    let html = data["AppointmentVisitTypeName"];
    return html;
  }

  DocListFormatter(data: any): string {
    let html = data["ProviderName"];
    return html;
  }

  public hotkeys(event) {
    if (event.keyCode == 27) {
      this.appEmiter.emit("Close");
    }
  }

 

  OnTimeChange() {
    console.log("Time change");
    let start = moment(this.CurrentAppointment.AppointmentTime, "HH:mm");
    let endParsedTime = start.add(15, 'minutes').format('HH:mm')
    this.CurrentAppointment.AppointmentEndTime = endParsedTime;
  }

  Close() {
    this.appEmiter.emit("Close");
  }

}
