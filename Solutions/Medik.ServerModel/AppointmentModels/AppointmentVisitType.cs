using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Medik.ServerModel.AppointmentVisitTypeModel
{
    //Ghassan:21Feb'23-- Needed during create appointment   
    public class AppointmentVisitTypeModel
    {
        [Key]
        public int AppointmentVisitTypeId { get; set; }
        public string AppointmentVisitTypeName { get; set; }
        public int DepartmentId { get; set; }
        public int AppointmentVisitTypeLength { get; set; }
        public int? LookupCategoryId { get; set; }
        public int? LookupTypeId { get; set; }
        public DateTime? CreatedOn { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
    }
}
