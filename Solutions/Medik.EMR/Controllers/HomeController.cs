using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Microsoft.AspNetCore.Mvc;
using Medik.Security;
using Medik.Utilities;
using Microsoft.Extensions.Options;
using Medik.Core.Configuration;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net;
using System.IO;

namespace Medik.Controllers
{
    public class HomeController : Controller
    {

        private readonly string connString = null;
        public HomeController(IOptions<MyConfiguration> _config)
        {
            connString = _config.Value.Connectionstring;

        }

        public IActionResult Index()
        {
            try
            {
                return View();
            }
            catch (Exception ex)
            {
                //Redirect to Login page If user is not login                           
                return RedirectToAction("Login", "Account");

            }
        }
        //move it out of patientcontroller to Maincontroller or something..
        public IActionResult AppMain()
        {
            try
            {
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
                ViewData["currentuser"] = currentUser;
                //getting only the root level routes for this view.//set getHierarchy = true for AppMain (special condition.)
                ViewData["validroutes"] = RBAC.GetRoutesForUser(currentUser.UserId, getHiearrchy: true);
                return View();
            }
            catch (Exception ex)
            {
                //throw ex;
                //Redirect to Login page If user is not login                           
                return RedirectToAction("Login", "Account");
            }
        }
        public IActionResult ChangePassword()
        {
            try
            {
                return View();
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }


        public FileStreamResult GetUserManual()
        {
            FileStream usrManual = new FileStream("wwwroot\\fileuploads\\Medik_UserManual.pdf", FileMode.Open);
            return new FileStreamResult(usrManual,"application/pdf");
        }


    }
}