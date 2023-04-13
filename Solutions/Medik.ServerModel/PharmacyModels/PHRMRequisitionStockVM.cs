﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Medik.ServerModel.PharmacyModels;

namespace Medik.ServerModel
{
   public class PHRMRequisitionStockVM
    {
        //public List<PHRMDispensaryStockModel> stock = new List<PHRMDispensaryStockModel>();
        public PHRMStoreRequisitionModel requisition = new PHRMStoreRequisitionModel();
        public List<PHRMDispatchItemsModel> dispatchItems = new List<PHRMDispatchItemsModel>();
        public List<PHRMStockTransactionModel> stockTransactions = new List<PHRMStockTransactionModel>();
    }
}
