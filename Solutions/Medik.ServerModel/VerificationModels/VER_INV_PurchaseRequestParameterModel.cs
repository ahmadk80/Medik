﻿using System;
using System.Collections.Generic;

namespace Medik.ServerModel
{
    public class VER_INV_PurchaseRequestParameterModel
    {
        public bool EnableVerification { get; set; }
        public int VerificationLevel { get; set; }
        public List<int> PermissionIds { get; set; }
    }
}
