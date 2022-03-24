using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace VRCX
{
    public partial class InvisPopup : Form
    {
        public InvisPopup()
        {
            InitializeComponent();
        }

        protected override void SetVisibleCore(bool value)
        {
            this.WindowState = FormWindowState.Minimized;
            base.SetVisibleCore(value);
        }
    }
}
