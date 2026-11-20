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
import SettingsScreen from './screens/SettingsScreen';

const navigation=[['overview','⌂','Overview'],['orders','↗','Orders'],['catalog','▦','Food catalog'],['tables','⌗','Tables & QR'],['customers','◎','Customers'],['delivery','⇢','Delivery'],['settings','⚙','Settings']];
const screens={overview:DashboardScreen,orders:OrdersScreen,catalog:CatalogScreen,tables:TablesScreen,customers:CustomersScreen,delivery:DeliveryScreen,settings:SettingsScreen};

export default function App(){
 const [token,setToken]=useState(()=>localStorage.getItem('restro.admin.token')||'');
 const [staff,setStaff]=useState(()=>{try{return JSON.parse(localStorage.getItem('restro.admin.staff')||'null')}catch{return null}});
 const [active,setActive]=useState('overview');const [authCheck,setAuthCheck]=useState(Boolean(token));const [authError,setAuthError]=useState('');
 const revision=useAdminRealtime(token);
 useEffect(()=>{if(!token){setAuthCheck(false);return}api('/auth/me',{token}).then(account=>{if(account.role!=='MANAGER')throw new Error('Manager access is required for this panel.');setStaff(account);localStorage.setItem('restro.admin.staff',JSON.stringify(account))}).catch(e=>{setAuthError(e.message);setToken('');localStorage.removeItem('restro.admin.token');localStorage.removeItem('restro.admin.staff')}).finally(()=>setAuthCheck(false))},[]);
 function login(result){const newToken=result.token;setToken(newToken);setStaff(result.staff);localStorage.setItem('restro.admin.token',newToken);localStorage.setItem('restro.admin.staff',JSON.stringify(result.staff));setAuthError('')}
 function logout(){setToken('');setStaff(null);localStorage.removeItem('restro.admin.token');localStorage.removeItem('restro.admin.staff')}
 if(authCheck)return <div className="boot-screen"><span className="admin-mark">R✳</span><p>Connecting to the restaurant…</p></div>;
 if(!token)return <><LoginScreen onLogin={login}/>{authError&&<div className="login-error-toast">{authError}</div>}</>;
 const Screen=screens[active]||DashboardScreen;
 return <div className="admin-app"><aside className="sidebar"><div className="sidebar-brand"><span className="admin-mark">R<span>✳</span></span><span>RESTRO<small>BACK OF HOUSE</small></span></div><div className="restaurant-switch"><span className="restaurant-avatar">{(staff?.restaurantName||'E').slice(0,1)}</span><span>{staff?.restaurantName||'Restaurant'}<small>MANAGER WORKSPACE</small></span><b>⌄</b></div><span className="nav-label">WORKSPACE</span><nav>{navigation.map(([id,icon,label])=><button key={id} className={active===id?'nav-link active':'nav-link'} onClick={()=>setActive(id)}><span>{icon}</span>{label}{id==='orders'&&revision>0&&<i className="nav-ping"/>}</button>)}</nav><div className="sidebar-bottom"><div className="staff-avatar">{staff?.name?.slice(0,1)||'M'}</div><span>{staff?.name||'Manager'}<small>Restaurant manager</small></span><button onClick={logout} title="Sign out">↪</button></div></aside><main className="admin-main"><header className="admin-topbar"><div><span className="live-badge"><i/> CONNECTION LIVE</span><span className="breadcrumb">EMBER & SPICE <b>/</b> {navigation.find(x=>x[0]===active)?.[2].toUpperCase()}</span></div><div className="topbar-right"><span className="online-dot"/> Live sync on <span className="topbar-divider"/>{new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}<button className="profile-chip" onClick={logout}>{staff?.name?.slice(0,1)||'M'}</button></div></header><div className="screen-content"><Screen token={token} revision={revision}/><footer className="admin-footer"><span>GOOD FOOD. GOOD SERVICE. GOOD WORK.</span><span>LIVE DATA · {staff?.restaurantName||'EMBER & SPICE'}</span></footer></div></main></div>;
}
