using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace VRCX
{
    public class WinformBase : Form
    {
        protected override void OnHandleCreated(EventArgs e)
        {
            WinformThemer.SetThemeToGlobal(this);
            base.OnHandleCreated(e);
        }
    }
}
