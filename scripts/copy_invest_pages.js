const fs = require('fs');
const path = require('path');
const roles = ['manager', 'admin', 'keeper', 'accountant'];
const baseDir = 'c:\\Users\\Mufti_Ibn_Al_Khattab\\Desktop\\lib\\code\\FlockFund_II\\src\\app';

const investSrc = fs.readFileSync(path.join(baseDir, 'investor', 'invest', 'page.tsx'), 'utf-8');
const callbackSrc = fs.readFileSync(path.join(baseDir, 'investor', 'payment', 'callback', 'page.tsx'), 'utf-8');

roles.forEach(role => {
  const roleInvestDir = path.join(baseDir, role, 'invest');
  const roleCallbackDir = path.join(baseDir, role, 'payment', 'callback');
  
  fs.mkdirSync(roleInvestDir, { recursive: true });
  fs.mkdirSync(roleCallbackDir, { recursive: true });
  
  let newInvest = investSrc.replace(
    /flock_id:\s*selectedFlock,/,
    'flock_id: selectedFlock,\n          callback_url: `${window.location.origin}/' + role + '/payment/callback`,'
  );
  fs.writeFileSync(path.join(roleInvestDir, 'page.tsx'), newInvest);
  
  let newCallback = callbackSrc.replace(/\/investor/g, '/' + role);
  fs.writeFileSync(path.join(roleCallbackDir, 'page.tsx'), newCallback);
  
  console.log(`Created invest & callback for ${role}`);
});
