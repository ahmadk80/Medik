using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.FileProviders;
using System.IO;
using Microsoft.CodeAnalysis;
using Microsoft.AspNetCore.Mvc.Razor;

using Medik.ServerModel;
using Medik.Security;
using Medik.Core.Caching;
using Medik.Core.Configuration;
using Medik.DalLayer;
using Medik.Utilities; 
using Medik.CommonTypes;
using Medik.Services.Pharmacy.Rack;
using Newtonsoft.Json.Serialization;
using Medik.Services;
using System.Data.SqlClient;
using Audit.SqlServer.Providers;
using Medik.Services.Dispensary;
using Medik.Services.Maternity;
using Medik.Services.DispensaryTransfer;
using Medik.Services.Vaccination;
using Medik.Services.Pharmacy.PharmacyPO;
using Medik.Services.LIS;
using Medik.Services.Pharmacy.SupplierLedger;
using Medik.Services.QueueManagement;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Server.Kestrel.Core;

namespace Medik
{
    public class Startup
    {

        public IConfigurationRoot Configuration { get; }
        public Microsoft.AspNetCore.Hosting.IHostingEnvironment CurrentEnvironment { get; set; }

        public Startup(Microsoft.AspNetCore.Hosting.IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();
            Configuration = builder.Build();

            CurrentEnvironment = env;          
            //check audit is enable or disable             
            if ((!string.IsNullOrEmpty(Configuration["IsAuditEnable"])) && Convert.ToBoolean(Configuration["IsAuditEnable"])==true)
            {                
                string adminConstr = Configuration["ConnectionStringAdmin"];
                SqlConnectionStringBuilder conBuilderObj = new SqlConnectionStringBuilder(adminConstr);                
                string encPwd = conBuilderObj.Password;
                if (!string.IsNullOrEmpty(encPwd))  //check is it encrypted or not
                {
                    string decPwd= DecryptPassword(encPwd);                 
                    conBuilderObj.Password = decPwd;                    
                }              
                Audit.Core.Configuration.DataProvider = new SqlDataProvider()
                {
                    ConnectionString = conBuilderObj.ConnectionString,
                    Schema = "dbo",
                    TableName = "DanpheAudit",
                    IdColumnName = "AuditId",
                    JsonColumnName = "Data",
                    LastUpdatedDateColumnName = "LastUpdatedDate"
                };
            }
            
           
        }


        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // If using Kestrel:
            services.Configure<KestrelServerOptions>(options =>
            {
                options.AllowSynchronousIO = true;
            });

            // If using IIS:
            services.Configure<IISServerOptions>(options =>
            {
                options.AllowSynchronousIO = true;
            });

            //start--for rbac-testing--sudarshanr--2march-2017
            //services.AddSession();

            // Adds a default in-memory implementation of IDistributedCache.
            //services.AddDistributedMemoryCache();//removed after using sqlserver-distributed cache-18apr'17-sudarshan

            services.AddSession(options =>
            {
                //IMPORTANT-- remove the hardcoded value 20 from below
                //keep short timeout like max 2-3 hours, 
                //we've to redirect to login once the session expires.
                options.IdleTimeout = TimeSpan.FromHours(2);
                options.Cookie.HttpOnly = true;
                

            });
            //end--for rbac-testing--sudarshanr


            services.AddTransient<IRackService, RackService>();
            services.AddTransient<IInventoryCompanyService, InventoryCompanyService>();
            services.AddTransient<IDesignationService, DesignationService>();
            services.AddTransient<IInventoryReceiptNumberService, InventoryReceiptNumberService>();
            services.AddTransient<IInventoryGoodReceiptService, InventoryGoodReceiptService>();
            services.AddTransient<IEmailService, EmailService>();
            services.AddTransient<IFractionPercentService, FractionPercentService>();
            services.AddTransient<IFractionCalculationService, FractionCalculationService>();
            services.AddTransient<IVerificationService, VerificationService>();
            services.AddTransient<IDispensaryService, DispensaryService>();
            services.AddTransient<IDispensaryRequisitionService, DispensaryRequisitionService>();
            services.AddTransient<IMaternityService, MaternityService>();
            services.AddTransient<IDispensaryTransferService, DispensaryTransferService>();
            services.AddTransient<IActivateInventoryService, ActivateInventoryService>();
            services.AddTransient<IPharmacyPOService, PharmacyPOService>();
            services.AddTransient<IVaccinationService, VaccinationService>();
            services.AddTransient<ICssdItemService, CssdItemService>();
            services.AddTransient<ICssdReportService, CssdReportService>();
            services.AddTransient<INepaliReceiptService, NepaliReceiptService>();
            services.AddTransient<ISupplierLedgerService, SupplierLedgerService>();
            services.AddTransient<IFileUploadService, GoogleDriveFileUploadService>();
            services.AddTransient<ILISService, LISService>();
            services.AddTransient<IQueueManagementService, QueueManagementService>();

            // Add framework services.
            services.AddOptions();

            services.Configure<MyConfiguration>(Configuration);

            //start: sud-9Jan'19 for pwd encryption testing

            //For Medik Database connectionstring..
            //reads connectionstring
            string connStr = Configuration["Connectionstring"];
            //this inbuilt class maps connString to separate properties                                                  
            SqlConnectionStringBuilder connStringBuilder = new SqlConnectionStringBuilder(connStr);
            string encPassword = connStringBuilder.Password;
            //if password is present, it must be in encrypted form., only then go for decryption, else keep it as it is.
            if (!string.IsNullOrEmpty(encPassword))
            {
                //decrypt the password and re-assign the values to actual Connstring
                string decrypted = DecryptPassword(encPassword);//this calls our internal function of RBAC
                connStringBuilder.Password = decrypted;
                Configuration["Connectionstring"] = connStringBuilder.ToString();
            }

            //For DanpheAdmin Database connectionstring.
            string connStrAdmin = Configuration["ConnectionStringAdmin"];
            SqlConnectionStringBuilder connStringBuilder2 = new SqlConnectionStringBuilder(connStrAdmin);
            string encPwd_Admin = connStringBuilder2.Password;
            //if password is present, only then go for decryption, else keep it as it is.
            if (!string.IsNullOrEmpty(encPwd_Admin))
            {
                string decPwd_Admin = DecryptPassword(encPwd_Admin);//this calls our internal function of RBAC
                connStringBuilder2.Password = decPwd_Admin;
                Configuration["ConnectionStringAdmin"] = connStringBuilder2.ToString();
            }

            //end: sud-9Jan'19 for pwd encryption testing

            //services.AddMvc();//.AddJsonOptions(new DefaultContractResolver());
                     //   .AddNewtonsoftJson(options => options.SerializerSettings.ContractResolver = new DefaultContractResolver()); // added for disabling serialising json with  camel case
                     services.AddRazorPages();
            //services.AddMvc().AddApplicationPart(typeof(LoginViewModel).Assembly);
            //start: using service configuration for caching class.--sudarshan 1march'17
            //once we've added appsetting.json into the Configuration, it's accessible easily using the key.
            string connString = Configuration["Connectionstring"];
            int cacheExpMins = Convert.ToInt32(Configuration["CacheExpirationMinutes"]);
            //add cache as singleton since there should be one global object of it.. 
            services.AddSingleton<DanpheCache>(new DanpheCache(connString, cacheExpMins));
            //end: using service configuration for caching class.

            //used in LabReportExport to differntiate abnormal values based on this parameter
            bool highlightAbnormalLabResult = Convert.ToBoolean(Configuration["highlightAbnormalLabResult"]);

            //AuditTrail Enable and Disable 
            string auditValueStr = Configuration["IsAuditEnable"];
            if (!string.IsNullOrEmpty(auditValueStr))
            {
                bool IsAuditEnable = Convert.ToBoolean(auditValueStr);
                if (IsAuditEnable == false)
                {
                    Audit.Core.Configuration.AuditDisabled = true;
                }
            }
            else
            {
                Audit.Core.Configuration.AuditDisabled = true;
            }

            ////for distributed sqlserver caching --added: 18Apr2017-sudarshan
            //services.AddDistributedSqlServerCache(options =>
            //{
            //    options.ConnectionString = connString;
            //    options.SchemaName = "dbo";
            //    options.TableName = "CORE_DistributedCache"; // this has to be same what we gave while running the command.
            //});

            //add RBAC also as a singleton service.          
            services.AddSingleton<RBAC>(new RBAC(connString, cacheExpMins));
            ///add nepali date as a singleton for one time initialization.
            services.AddSingleton<NepaliDate>(new NepaliDate(connString));

            //add FileUploader as a singleton as well
            string storagePath = CurrentEnvironment.WebRootPath + "\\" + Configuration["FileStorageRelativeLocation"];
            services.AddSingleton<FileUploader>(new FileUploader(storagePath));


            //services.Configure((RazorViewEngineOptions options) =>
            //    {
            //        var previous = options.CompilationCallback;

            //        options.CompilationCallback().AddJsonOptions = (context) =>
            //        {
            //            previous?.Invoke(context);

            //            context.Compilation = context.Compilation.
            //                        AddReferences(MetadataReference.CreateFromFile(typeof(
            //                         MasterDbContext).Assembly.Location));

            //            context.Compilation = context.Compilation.
            //                       AddReferences(MetadataReference.CreateFromFile(typeof(
            //                       CountryModel).Assembly.Location));
            //            context.Compilation = context.Compilation.
            //                       AddReferences(MetadataReference.CreateFromFile(typeof(
            //                       CountrySubDivisionModel).Assembly.Location));

            //            context.Compilation = context.Compilation.
            //                       AddReferences(MetadataReference.CreateFromFile(typeof(
            //                       ICD10CodeModel).Assembly.Location));
            //            context.Compilation = context.Compilation.c
            //                       AddReferences(MetadataReference.CreateFromFile(typeof(
            //                       EmployeeModel).Assembly.Location));
            //            context.Compilation = context.Compilation.
            //                      AddReferences(MetadataReference.CreateFromFile(typeof(
            //                      ServiceDepartmentModel).Assembly.Location));
            //            context.Compilation = context.Compilation.
            //                    AddReferences(MetadataReference.CreateFromFile(typeof(LoginViewModel).Assembly.Location));
            //            context.Compilation = context.Compilation.
            //                   AddReferences(MetadataReference.CreateFromFile(typeof(DanpheRoute).Assembly.Location));
            //            context.Compilation = context.Compilation.
            //                 AddReferences(MetadataReference.CreateFromFile(typeof(DanpheCache).Assembly.Location));

            //        };
            //    });

            services.AddMvc()
               .ConfigureApplicationPartManager(context =>
               {
                   var startupAssembly = typeof(Startup).GetTypeInfo().Assembly;
                   var assemblies = startupAssembly.GetReferencedAssemblies().Select(Assembly.Load).ToList();
                   assemblies.Add(typeof(MasterDbContext).GetTypeInfo().Assembly);
                   assemblies.Add(typeof(CountryModel).GetTypeInfo().Assembly);
                   assemblies.Add(typeof(CountrySubDivisionModel).GetTypeInfo().Assembly);
                   assemblies.Add(typeof(ICD10CodeModel).GetTypeInfo().Assembly);
                   assemblies.Add(typeof(EmployeeModel).GetTypeInfo().Assembly);
                   assemblies.Add(typeof(ServiceDepartmentModel).GetTypeInfo().Assembly);
                   assemblies.Add(typeof(LoginViewModel).GetTypeInfo().Assembly);
                   assemblies.Add(typeof(DanpheRoute).GetTypeInfo().Assembly);
                   assemblies.Add(typeof(DanpheCache).GetTypeInfo().Assembly);
                 
                   foreach (var assembly in assemblies)
                   {
                       context.ApplicationParts.Add(new AssemblyPart(assembly));
                   }
               });
                        services.Configure((RazorViewEngineOptions options) =>
            {
                

                //var previous = options.CompilationCallback;
                //options.CompilationCallback = (context) =>
                //{
                //    previous?.Invoke(context);

                //    context.Compilation = context.Compilation.
                //                AddReferences(MetadataReference.CreateFromFile(typeof(
                //                 MasterDbContext).Assembly.Location));

                //    context.Compilation = context.Compilation.
                //               AddReferences(MetadataReference.CreateFromFile(typeof(
                //               CountryModel).Assembly.Location));
                //    context.Compilation = context.Compilation.
                //               AddReferences(MetadataReference.CreateFromFile(typeof(
                //               CountrySubDivisionModel).Assembly.Location));

                //    context.Compilation = context.Compilation.
                //               AddReferences(MetadataReference.CreateFromFile(typeof(
                //               ICD10CodeModel).Assembly.Location));
                //    context.Compilation = context.Compilation.
                //               AddReferences(MetadataReference.CreateFromFile(typeof(
                //               EmployeeModel).Assembly.Location));
                //    context.Compilation = context.Compilation.
                //              AddReferences(MetadataReference.CreateFromFile(typeof(
                //              ServiceDepartmentModel).Assembly.Location));
                //    context.Compilation = context.Compilation.
                //            AddReferences(MetadataReference.CreateFromFile(typeof(LoginViewModel).Assembly.Location));
                //    context.Compilation = context.Compilation.
                //           AddReferences(MetadataReference.CreateFromFile(typeof(DanpheRoute).Assembly.Location));
                //    context.Compilation = context.Compilation.
                //         AddReferences(MetadataReference.CreateFromFile(typeof(DanpheCache).Assembly.Location));

                //};
            }); ;
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, Microsoft.AspNetCore.Hosting.IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            //loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            //loggerFactory.AddDebug();
            app.UseDeveloperExceptionPage();
            app.UseMiddleware<RewindMiddleWare>();
            //start--for rbac-testing--sudarshanr--2march-2017
            app.UseSession();
            app.UseRouting();
            //end--for rbac-testing--sudarshanr


            //app.UseMvc(
            //    routes =>
            //    {
            //        routes.MapRoute("DefaultRoute", "{controller}/{action}");
            //        routes.MapRoute(name: "Default", template: "{controller}/{action}", defaults: new { controller = "Account", action = "Login" });
            //    }
            //    );

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(name: "default", pattern: "{controller}/{action}", defaults: new { controller = "Account", action = "Login" });
                //endpoints.MapControllerRoute(name: "default", pattern: "{controller=Home}/{action=Index}/{id?}", defaults: new { controller = "Account", action = "Login" });
            });


            app.UseFileServer();

            // set a home page
            DefaultFilesOptions defaultoptions = new DefaultFilesOptions();
            defaultoptions.DefaultFileNames.Clear();
            defaultoptions.DefaultFileNames.Add("UI/Main.html");
            app.UseDefaultFiles(defaultoptions);
            //app.UseMiddleware<>
            app.UseStaticFiles();
            // this will serve up node_modules
            // this code is bad here i am saying add the mode_modules
            // with wwwroot. This i did because when a page runs 
            // inside wwwroot he has no way to access folders outside
            // the wwwroot. Putting this complete folder inside
            // wwwroot would be a kill. So later 
            // we need to write a grunt task which will copy the necessaayr files
            // to wwwroot. The task woul sit here

            string isDevEnv = Configuration["environment:isdevelopment"];


            if (bool.Parse(isDevEnv))//env.IsDevelopment build it only if it's development.
            {
                var provider = new PhysicalFileProvider(
                              Path.Combine(env.ContentRootPath, "wwwroot\\DanpheApp\\node_modules")
                          );
                var options = new FileServerOptions();
                options.RequestPath = "/node_modules";
                options.StaticFileOptions.FileProvider = provider;
                options.EnableDirectoryBrowsing = true;
                app.UseFileServer(options);
            }
        }


        //start: sud-9Jan'19-- for ConnectionString encryption/decryption

        //use existing decrypt method from RBAC.
        private string DecryptPassword(string encryptedPwd)
        {
            string retVal = Medik.Security.RBAC.DecryptPassword(encryptedPwd);
            return retVal;
        }

        //end: sud-9Jan'19-- for ConnectionString encryption/decryption

    }
}
