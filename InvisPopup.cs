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
            StartPosition = FormStartPosition.Manual;
            //Location = new Point(-Height - 100, 0);
            Location = new Point(0, 0);
            InitializeComponent();
        }

        //protected override void SetVisibleCore(bool value)
        //{
        //    base.SetVisibleCore(value);
        //}
    }
}
