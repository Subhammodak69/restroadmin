import {useEffect,useState} from 'react';
import './App.css';
import {api} from './api';
import useAdminRealtime from './hooks/useAdminRealtime';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import OrdersScreen from './screens/OrdersScreen';
import CatalogScreen from './screens/CatalogScreen';
import TablesScreen from './screens/TablesScreen';
import CustomersScreen from './screens/CustomersScreen';
import DeliveryScreen from './screens/DeliveryScreen';
import KitchenScreen from './screens/KitchenScreen';
import SettingsScreen from './screens/SettingsScreen';
import ThemeToggle from './components/ThemeToggle';
import { toast, Toaster } from 'react-hot-toast';

const navigation=[['overview','⌂','Overview'],['orders','↗','Orders'],['catalog','▦','Food catalog'],['tables','⌗','Tables & QR'],['customers','◎','Customers'],['delivery','⇢','Delivery'],['settings','⚙','Settings']];
const screens={overview:DashboardScreen,orders:OrdersScreen,catalog:CatalogScreen,tables:TablesScreen,customers:CustomersScreen,delivery:DeliveryScreen,settings:SettingsScreen};

export default function App(){
 const [token,setToken]=useState(()=>localStorage.getItem('restro.admin.token')||'');
 const [staff,setStaff]=useState(()=>{try{return JSON.parse(localStorage.getItem('restro.admin.staff')||'null')}catch{return null}});
 const [theme,setTheme]=useState(()=>localStorage.getItem('restro.admin.theme')||'dark');
 const [sidebarPinned,setSidebarPinned]=useState(false),[sidebarHovered,setSidebarHovered]=useState(false);
 const [active,setActive]=useState('overview');const [authCheck,setAuthCheck]=useState(Boolean(token));const [authError,setAuthError]=useState('');
 const {revision,connected,lastEvent}=useAdminRealtime(token);
 useEffect(()=>{localStorage.setItem('restro.admin.theme',theme)},[theme]);
 useEffect(()=>{if(!token){setAuthCheck(false);return}api('/auth/me',{token}).then(account=>{if(!['MANAGER','SUPERADMIN','KITCHEN'].includes(account.role))throw new Error('This account does not have access to the admin panel.');setStaff(account);localStorage.setItem('restro.admin.staff',JSON.stringify(account))}).catch(e=>{setAuthError(e.message);setToken('');localStorage.removeItem('restro.admin.token');localStorage.removeItem('restro.admin.staff')}).finally(()=>setAuthCheck(false))},[token]);
 useEffect(()=>{if(lastEvent?.event==='order.created')toast.success(`New ${String(lastEvent.payload?.orderType||'').replaceAll('_',' ').toLowerCase()} order ${lastEvent.payload?.orderNumber||''} received.`)},[lastEvent]);
 function login(result){const newToken=result.token;setToken(newToken);setStaff(result.staff);localStorage.setItem('restro.admin.token',newToken);localStorage.setItem('restro.admin.staff',JSON.stringify(result.staff));setAuthError('')}
 function logout(){setToken('');setStaff(null);localStorage.removeItem('restro.admin.token');localStorage.removeItem('restro.admin.staff')}
 if(authCheck)return <div className="boot-screen"><span className="admin-mark">R✳</span><p>Connecting to the restaurant…</p></div>;
 if(!token)return <div className="admin-app" data-theme={theme}><Toaster position="top-right" toastOptions={{duration:3200,style:{fontFamily:'Inter, sans-serif',fontSize:14,padding:'12px 16px',background:theme==='dark'?'#201f1d':'#fff',color:theme==='dark'?'#f2ece4':'#29241f',border:theme==='dark'?'1px solid #ffffff28':'1px solid #ded7ce'}}}/><LoginScreen onLogin={login} theme={theme} onToggleTheme={()=>setTheme(current=>current==='dark'?'light':'dark')}/>{authError&&<div className="login-error-toast">{authError}</div>}</div>;
 if(staff?.role==='KITCHEN')return <div className="admin-app kitchen-app" data-theme={theme}><Toaster position="top-right"/><KitchenScreen token={token} stationId={staff.stationId} stationName={staff.stationName} revision={revision} connected={connected} onLogout={logout}/></div>;
 const Screen=screens[active]||DashboardScreen;
 const sidebarExpanded=sidebarPinned||sidebarHovered;
 return (
  <div className={`admin-app ${sidebarExpanded?'sidebar-expanded':'sidebar-collapsed'}`} data-theme={theme}>
   <Toaster position="top-right" toastOptions={{duration:3200,style:{fontFamily:'Inter, sans-serif',fontSize:14,padding:'12px 16px',background:theme==='dark'?'#201f1d':'#fff',color:theme==='dark'?'#f2ece4':'#29241f',border:theme==='dark'?'1px solid #ffffff28':'1px solid #ded7ce'}}}/>
   <aside
    className={`sidebar ${sidebarExpanded?'sidebar-expanded':'sidebar-collapsed'}`}
    onMouseEnter={()=>setSidebarHovered(true)}
    onMouseLeave={()=>setSidebarHovered(false)}
    onFocusCapture={()=>setSidebarHovered(true)}
    onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setSidebarHovered(false)}}
   >
    <div className="sidebar-brand"><span className="admin-mark">R<span>✳</span></span><span>RESTRO<small>BACK OF HOUSE</small></span></div>
    <div className="restaurant-switch"><span className="restaurant-avatar">{(staff?.restaurantName||'E').slice(0,1)}</span><span>{staff?.restaurantName||'Restaurant'}<small>MANAGER WORKSPACE</small></span><b>⌄</b></div>
    <span className="nav-label">WORKSPACE</span>
    <nav aria-label="Workspace navigation">{navigation.map(([id,icon,label])=><button key={id} type="button" title={label} aria-label={label} className={active===id?'nav-link active':'nav-link'} onClick={()=>setActive(id)}><span className="nav-link-icon" aria-hidden="true">{icon}</span><span className="nav-link-label">{label}</span>{id==='orders'&&revision>0&&<i className="nav-ping"/>}</button>)}</nav>
    <div className="sidebar-bottom"><div className="staff-avatar">{staff?.name?.slice(0,1)||'M'}</div><span>{staff?.name||'Manager'}<small>Restaurant manager</small></span><button type="button" onClick={logout} title="Sign out" aria-label="Sign out">↪</button></div>
   </aside>
   <main className="admin-main">
    <header className="admin-topbar">
     <div>
      <button className="sidebar-toggle" type="button" aria-label={sidebarExpanded?'Collapse sidebar':'Expand sidebar'} aria-expanded={sidebarExpanded} title={sidebarExpanded?'Collapse sidebar':'Expand sidebar'} onClick={()=>setSidebarPinned(!sidebarExpanded)}><span className="menu-glyph" aria-hidden="true"><i/><i/><i/></span></button>
      <span className="live-badge"><i/> {connected?'CONNECTION LIVE':'RECONNECTING'}</span>
      <span className="breadcrumb">EMBER &amp; SPICE <b>/</b> {navigation.find(x=>x[0]===active)?.[2].toUpperCase()}</span>
     </div>
     <div className="topbar-right"><span className="online-dot"/> Live sync {connected?'on':'offline'} <span className="topbar-divider"/>{new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}<ThemeToggle theme={theme} onToggle={()=>setTheme(current=>current==='dark'?'light':'dark')}/><button className="profile-chip" type="button" onClick={logout} aria-label="Sign out">{staff?.name?.slice(0,1)||'M'}</button></div>
    </header>
    <div className="screen-content"><Screen token={token} revision={revision} onManageDelivery={()=>setActive('delivery')}/><footer className="admin-footer"><span>GOOD FOOD. GOOD SERVICE. GOOD WORK.</span><span>LIVE DATA · {staff?.restaurantName||'EMBER & SPICE'}</span></footer></div>
   </main>
  </div>
 );
}
