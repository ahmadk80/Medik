import { Component, ViewChild,ElementRef,Output,EventEmitter  } from '@angular/core';

import { VisitService } from '../shared/visit.service';
import { VisitBLService } from "../shared/visit.bl.service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { MessageboxService } from '../../shared/messagebox/messagebox.service';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import bootstrapPlugin from '@fullcalendar/bootstrap';
import listPlugin from '@fullcalendar/list';

import interactionPlugin from '@fullcalendar/interaction';
import {FullCalendarComponent}  from '@fullcalendar/angular';
import { EventInput } from '@fullcalendar/core';
import { OptionsInput } from '@fullcalendar/core';
import * as moment from 'moment/moment';
import { Appointment } from '../shared/appointment.model';
import { AppointmentDLService } from '../shared/appointment.dl.service';
import { AppointmentBLService } from '../shared/appointment.bl.service';
import { nextContext } from '@angular/core/src/render3';
declare var $ : any;

@Component({
  templateUrl: './calendar.component.html',
  host: { '(window:keydown)': 'hotkeys($event)'}
})

  export class CalendarComponent {
    
    public departmentId: number = 0;
    public selectedDepartment: any = null;

    public doctorList: Array<{ DepartmentId: number, DepartmentName: string, ProviderId: number, ProviderName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }> = [];
    public filteredDocList: Array<{ DepartmentId: number, DepartmentName: string, ProviderId: number, ProviderName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }>;
    public selectedDoctor: any = null;

    public ApptToAdd: Appointment = new Appointment();
    public ApptToUpdate: Appointment = new Appointment();
    public showApptPanel:boolean=false;
    public EditAPPMode: boolean = false;
 
    public enablePreview: boolean = false;
    currentEvents:EventInput[];
    options: OptionsInput;
    eventsModel: any;
    @ViewChild('calendar') calendar: FullCalendarComponent; // the #calendar in the template
    // @ViewChild('nameInput') nameInput: ElementRef;
    
    calendarVisible = true;
    calendarPlugins = [timeGridPlugin, dayGridPlugin,listPlugin, interactionPlugin,bootstrapPlugin];

    calendarWeekends = true;
    constructor(public visitService: VisitService, public appointmentBLService: AppointmentBLService,public appointmentDLService: AppointmentDLService, public visitBLService: VisitBLService, public msgBoxServ: MessageboxService){}
   

    populateAppointments( ){
      this.currentEvents=[];
      let colorE="#099887";
      this.visitService.ApptList.forEach(appt=>{
      
             if(appt.AppointmentStatus=='canceled') {   colorE='#ccc'}
        else if(appt.AppointmentStatus=='checkedin'){   colorE='#995010'}
        else if(appt.AppointmentStatus=='Initiated'){   colorE='#e24a49'}
        
        let apptStartDateTime=new Date(appt.AppointmentDate.substring(0,10)+"T"+appt.AppointmentTime)
        let apptEndDateTime=new Date(appt.AppointmentDate.substring(0,10)+"T"+appt.AppointmentEndTime)
       
        this.currentEvents = this.currentEvents.concat({
               id:appt.AppointmentId,
               title:appt.FirstName+" "+appt.LastName+" - "+appt.ProviderName,      
               start:apptStartDateTime,
               end:apptEndDateTime,
               allDay:false,
               color:colorE,
               extendedProps:{
                Doctor:appt.ProviderName,
               }
             });
      });
      this.handleEvents(this.currentEvents);
    }

    eventRender(e) {
      //const html = `<span>${e.event.title}</span>`+`<span> ${e.event.extendedProps.Doctor} </span>`;
      //e.el.innerHTML=html
      //console.log(e)
    }

    ngAfterViewInit(){
      this.LoadAppointments();
    }

    ngOnInit() {
      this.getDocts();
    }

    getDocts() {
      this.visitBLService.GetVisitDoctors()
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status == "OK") {
            this.visitService.ApptApplicableDoctorsList = res.Results;
            this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
            this.ApptToAdd.IsValidSelProvider = true;
          }
        });
    }

    public AssignSelectedDoctor() {
      this.filteredDocList;
      let doctor = null;
      if (this.selectedDoctor == "" || this.selectedDoctor == undefined) {
        this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
        
        this.ApptToAdd.IsValidSelProvider = true;
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
          this.ApptToAdd.ProviderId = doctor.ProviderId;//this will give providerid
          this.ApptToAdd.ProviderName = doctor.ProviderName;
          this.ApptToAdd.IsValidSelProvider = true;
          this.ApptToAdd.IsValidSelDepartment = true;
          this.ApptToAdd.DepartmentId = doctor.DepartmentId;
        }
        else {
          this.ApptToAdd.IsValidSelProvider = false;
        }
      }
      else {
        this.ApptToAdd.ProviderId = null;
        this.ApptToAdd.ProviderName = null;
      }
      this.LoadAppointments();
      this.ApptToAdd.IsValidTime();
    }

    LoadAppointments(){
      let providerId = this.selectedDoctor ? this.selectedDoctor.ProviderId : 0;
      if (providerId||providerId==0) {
      this.appointmentBLService.LoadAppointmentList(("2000-01-01"), ('2030-01-01'),providerId)
      .subscribe(res => {
        if (res.Status == "OK") {
          this.visitService.ApptList = res.Results;
        //  this.visitService.ApptList=this.visitService.ApptList.filter(a => a.ProviderId != this.AppDateToAdd.ProviderId);
          console.log("Appointment list loaded successfully");
          this.populateAppointments( );
          
        }
        else {
          console.log("Loading Appointment failed", [res.ErrorMessage])
          //alert("Failed ! " + res.ErrorMessage);
        }
      });
        } else {
          this.ApptToAdd.AppointmentList = new Array<Appointment>();
          this.visitService.ApptList= new Array<Appointment>();
      }
    }

    handleDateSelect(arg) {
      this.ApptToUpdate=new Appointment()
      this.ApptToAdd=new Appointment()
      if (arg.event){
        this.ApptToUpdate=this.visitService.ApptList.find(a => a.AppointmentId == arg.event.id);
      }else {
        this.ApptToAdd.AppointmentDate = arg.date;    
        this.ApptToAdd.AppointmentTime = arg.date;    
        let start = moment( arg.date);
        let endParsedTime = start.add(15, 'minutes').toLocaleString()
        this.ApptToAdd.AppointmentEndTime = endParsedTime;    
      }
     
       this.showApptPanel = true;     
    }

    AppCallBack(arg){
      this.showApptPanel = false;
      this.enablePreview = false;
    }
    
    changeEvent(arg) {
       this.ApptToUpdate=this.visitService.ApptList.find(a => a.AppointmentId == arg.event.id);
       this.ApptToUpdate.AppointmentDate = arg.event.start;  
       this.ApptToUpdate.AppointmentTime = arg.event.start;   
       this.ApptToUpdate.AppointmentEndTime = arg.event.end;   
       this.showApptPanel = true;     
    }
    
    public hotkeys(event) {
      if (event.keyCode == 27) {
        //this.appEmiter.emit("Close");
      }
    }
    
    get yearMonth(): string {
      const dateObj = new Date();  
      return dateObj.getUTCFullYear() + '-' + (dateObj.getUTCMonth() + 1);
    }

    handleEvents(events: EventInput[]) {
      this.currentEvents = events;
    }

    DocListFormatter(data: any): string {
      let html = data["ProviderName"];
      return html;
    }
   
}
