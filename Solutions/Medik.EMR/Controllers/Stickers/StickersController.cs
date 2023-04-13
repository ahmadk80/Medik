using Medik.CommonTypes;
using Medik.Core.Configuration;
using Medik.DalLayer;
using Medik.ServerModel;
using Medik.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Medik.Controllers
{
    [Route("api/[controller]/[action]")]
    public class StickersController : CommonController
    {
        DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
        public StickersController(IOptions<MyConfiguration> _config) : base(_config)
        {


        }
        public string GetPatientStickerDetails(int PatientId)
        {
            DanpheHTTPResponse<List<PatientStickerModel>> responseData = new DanpheHTTPResponse<List<PatientStickerModel>>();
            try
            {
                PatientDbContext patDbContext = new PatientDbContext(connString);
                StickersBL stick = new StickersBL();
                var res = stick.GetPatientStickerDetails(patDbContext, PatientId);
                responseData.Status = "OK";
                responseData.Results = res;
            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message;
            }
            return DanpheJSONConvert.SerializeObject(responseData);
        }
    }
}
