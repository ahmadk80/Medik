﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Medik.ServerModel
{
   public class AccountingLedgerVoucherMapViewModel
    {
        public LedgerGroupModel ledgerGroup = new LedgerGroupModel();
        public List<VoucherLedgerGroupMapModel> voucherLedgerGroupMap = new List<VoucherLedgerGroupMapModel>();
    }
}
