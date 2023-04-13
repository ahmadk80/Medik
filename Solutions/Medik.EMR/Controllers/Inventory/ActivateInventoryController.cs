using Medik.CommonTypes;
using Medik.Services;
using Microsoft.AspNetCore.Mvc;
using System;

namespace Medik.Controllers
{
    [Route("api/[controller]")]
    public class ActivateInventoryController : Controller
    {
        private IActivateInventoryService _activateInventory;
        public DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();

        public ActivateInventoryController(IActivateInventoryService activateInventory)
        {
            _activateInventory = activateInventory;
        }

        [HttpGet]
        public IActionResult GetAll()
        {

            try
            {
                responseData.Results = _activateInventory.GetAllInventories();
                responseData.Status = "OK";
            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }

           

            return Ok(responseData);
        }
        
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            try
            {
                responseData.Results = _activateInventory.GetInventory(id);
                responseData.Status = "OK";
            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }
            return Ok(responseData);
        }
    }
}
