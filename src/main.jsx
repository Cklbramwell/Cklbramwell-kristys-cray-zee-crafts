import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";
import {auth,db} from "./firebase";
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail} from "firebase/auth";
import {doc,setDoc,getDoc,collection,addDoc,query,where,onSnapshot,serverTimestamp,updateDoc,deleteDoc} from "firebase/firestore";

const fallback=[
{id:"shirt",name:"Custom T-Shirt",category:"T-Shirts",price:2500,salePrice:0,emoji:"👕",description:"Personalized shirt with your wording, colors, or graphic.",active:true,featured:true,colors:"Black, White, Pink",sizes:"S, M, L, XL, 2XL, 3XL"},
{id:"tumbler",name:"20 oz Custom Tumbler",category:"Tumblers",price:3000,salePrice:0,emoji:"🥤",description:"Personalized 20 oz tumbler.",active:true,featured:true,colors:"Custom",sizes:"20 oz"},
{id:"graphic",name:"Custom Graphic Design",category:"Graphics",price:2000,salePrice:0,emoji:"🖥️",description:"Custom digital artwork for your project.",active:true,featured:false,colors:"Custom",sizes:"Digital"}];

const money=c=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format((c||0)/100);
const price=p=>p.salePrice>0&&p.salePrice<p.price?p.salePrice:p.price;


function ProductCard({p,add}){
 return <div className="card product">
   {p.featured&&<span className="featured">FEATURED</span>}
   {p.salePrice>0&&p.salePrice<p.price&&<span className="sale">SALE</span>}
   <div className="product-art">{p.imageUrl?<img src={p.imageUrl} alt={p.name}/>:p.emoji||"🎨"}</div>
   <div className="product-body">
     <span className="tag">{p.category}</span>
     <h3>{p.name}</h3>
     <p className="muted">{p.description}</p>
     <div className="price">{money(price(p))}{p.salePrice>0&&p.salePrice<p.price&&<span className="old-price">{money(p.price)}</span>}</div>
     <br/>
     <button className="btn primary" onClick={()=>add(p.id)}>Add to Cart</button>
   </div>
 </div>;
}

function ShopPage({live,search,setSearch,category,setCategory,sort,setSort,shopItems,add}){
 const categories=["All",...new Set(live.map(p=>p.category))];
 return <section className="wrap">
   <div className="eyebrow">Shop</div>
   <h2>Custom products</h2>
   <div className="searchbar">
     <input
       value={search}
       onChange={e=>setSearch(e.target.value)}
       placeholder="Search products, colors, sizes..."
       aria-label="Search products"
     />
     <select value={sort} onChange={e=>setSort(e.target.value)}>
       <option value="featured">Featured first</option>
       <option value="price-low">Price low to high</option>
       <option value="price-high">Price high to low</option>
     </select>
   </div>
   <div className="filters">
     {categories.map(c=><button className={category===c?"active":""} onClick={()=>setCategory(c)} key={c}>{c}</button>)}
   </div>
   <div className="grid g4">
     {shopItems.map(p=><ProductCard p={p} add={add} key={p.id}/>)}
   </div>
 </section>;
}

function App(){
 const [route,setRoute]=useState("home"),[user,setUser]=useState(null),[profile,setProfile]=useState(null);
 const [products,setProducts]=useState([]),[orders,setOrders]=useState([]),[adminOrders,setAdminOrders]=useState([]),[requests,setRequests]=useState([]),[users,setUsers]=useState([]);
 const [adminTab,setAdminTab]=useState("dashboard"),[search,setSearch]=useState(""),[category,setCategory]=useState("All"),[sort,setSort]=useState("featured");
 const [editing,setEditing]=useState(null),[message,setMessage]=useState(""),[checkoutLoading,setCheckoutLoading]=useState(false);
 const [cart,setCart]=useState(()=>JSON.parse(localStorage.getItem("kcc_v5_cart")||"[]"));
 const all=products.length?products:fallback;
 const live=all.filter(p=>p.active!==false);

 useEffect(()=>localStorage.setItem("kcc_v5_cart",JSON.stringify(cart)),[cart]);
 useEffect(()=>{const t=message?setTimeout(()=>setMessage(""),2400):null;return()=>t&&clearTimeout(t)},[message]);
 useEffect(()=>{
   const params=new URLSearchParams(window.location.search);
   const result=params.get("checkout");
   if(result==="success"){
     setCart([]);
     setMessage("Payment successful! Your cart has been cleared.");
     window.history.replaceState({},document.title,window.location.pathname);
   }else if(result==="cancel"){
     setMessage("Checkout canceled. Your cart is still saved.");
     window.history.replaceState({},document.title,window.location.pathname);
   }
 },[]);
 useEffect(()=>onSnapshot(collection(db,"products"),s=>setProducts(s.docs.map(d=>({id:d.id,...d.data()}))),()=>{}),[]);
 useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);setProfile(null);if(!u)return;const s=await getDoc(doc(db,"users",u.uid));setProfile(s.exists()?s.data():null)}),[]);
 useEffect(()=>{if(!user)return;return onSnapshot(query(collection(db,"orders"),where("userId","==",user.uid)),s=>setOrders(s.docs.map(d=>({id:d.id,...d.data()}))))},[user]);
 useEffect(()=>{if(profile?.role!=="admin")return;const stops=[
   onSnapshot(collection(db,"orders"),s=>setAdminOrders(s.docs.map(d=>({id:d.id,...d.data()})))),
   onSnapshot(collection(db,"customRequests"),s=>setRequests(s.docs.map(d=>({id:d.id,...d.data()})))),
   onSnapshot(collection(db,"users"),s=>setUsers(s.docs.map(d=>({id:d.id,...d.data()}))))
 ];return()=>stops.forEach(x=>x())},[profile]);

 const notify=m=>setMessage(m),nav=r=>{setRoute(r);window.scrollTo(0,0)};
 const add=id=>setCart(c=>{const n=[...c],f=n.find(x=>x.id===id);f?f.qty++:n.push({id,qty:1});return n});
 const beginCheckout=async()=>{
   if(!cart.length)return notify("Your cart is empty.");
   if(!user){
     notify("Please sign in before checkout so your order can be saved to your account.");
     nav("account");
     return;
   }
   setCheckoutLoading(true);
   try{
     const idToken=await user.getIdToken();
     const response=await fetch("/.netlify/functions/create-checkout",{
       method:"POST",
       headers:{
         "Content-Type":"application/json",
         "Authorization":`Bearer ${idToken}`
       },
       body:JSON.stringify({
         items:cart.map(({id,qty})=>({id,qty}))
       })
     });
     const data=await response.json();
     if(!response.ok)throw new Error(data.error||"Unable to start checkout.");
     if(!data.url)throw new Error("Stripe did not return a checkout URL.");
     window.location.assign(data.url);
   }catch(error){
     notify(error.message||"Unable to start checkout.");
     setCheckoutLoading(false);
   }
 };
 const updateAdminOrder=async(order,changes)=>{
   if(!user)return notify("Admin sign-in required.");
   try{
     const idToken=await user.getIdToken();
     const response=await fetch("/.netlify/functions/update-order",{
       method:"POST",
       headers:{
         "Content-Type":"application/json",
         "Authorization":`Bearer ${idToken}`
       },
       body:JSON.stringify({orderId:order.id,changes})
     });
     const text=await response.text();
     let data={};
     try{data=JSON.parse(text)}catch{}
     if(!response.ok)throw new Error(data.error||text||"Unable to update order.");
     notify("Order updated");
   }catch(error){
     notify(error.message||"Unable to update order.");
   }
 };
 const subtotal=useMemo(()=>cart.reduce((s,i)=>{const p=all.find(x=>x.id===i.id);return s+(p?price(p)*i.qty:0)},0),[cart,all]);
 const shopItems=useMemo(()=>{
   let x=[...live];
   if(category!=="All")x=x.filter(p=>p.category===category);
   if(search.trim()){const q=search.toLowerCase();x=x.filter(p=>[p.name,p.category,p.description,p.colors,p.sizes].join(" ").toLowerCase().includes(q))}
   if(sort==="price-low")x.sort((a,b)=>price(a)-price(b));
   if(sort==="price-high")x.sort((a,b)=>price(b)-price(a));
   if(sort==="featured")x.sort((a,b)=>(b.featured?1:0)-(a.featured?1:0));
   return x;
 },[live,category,search,sort]);

 const Home=()=> <><section className="wrap hero"><div><div className="eyebrow">Custom creations made for you</div><h1>Turn your ideas into something <span className="gradient">Cray-Zee creative.</span></h1><p className="lead">Shop personalized shirts, tumblers and graphics, manage custom requests, and earn loyalty rewards.</p><div className="row"><button className="btn primary" onClick={()=>nav("shop")}>Shop Now</button><button className="btn secondary" onClick={()=>nav("custom")}>Custom Order</button></div></div><img src="/assets/kristys-logo.png"/></section><section className="wrap"><h2>Featured</h2><div className="grid g3">{live.filter(p=>p.featured).slice(0,3).map(p=><ProductCard p={p} add={add} key={p.id}/>)}</div></section></>;
 const Account=()=> !user?<section className="wrap"><div className="grid g2"><form className="card form" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await signInWithEmailAndPassword(auth,f.get("email"),f.get("password"));notify("Signed in")}catch(x){notify(x.message)}}}><h2 className="full">Sign In</h2><div className="field full"><label>Email</label><input name="email" type="email" required/></div><div className="field full"><label>Password</label><input name="password" type="password" required/></div><div className="full row"><button className="btn primary">Sign In</button><button type="button" className="btn secondary" onClick={async()=>{const e=prompt("Email");if(e)await sendPasswordResetEmail(auth,e)}}>Forgot Password</button></div></form><form className="card form" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const c=await createUserWithEmailAndPassword(auth,f.get("email"),f.get("password"));await setDoc(doc(db,"users",c.user.uid),{name:f.get("name"),email:f.get("email"),phone:f.get("phone"),role:"customer",loyaltyPunches:0,availableRewards:0,createdAt:serverTimestamp()});notify("Account created")}catch(x){notify(x.message)}}}><h2 className="full">Create Account</h2><div className="field full"><label>Name</label><input name="name" required/></div><div className="field"><label>Email</label><input name="email" type="email" required/></div><div className="field"><label>Phone</label><input name="phone"/></div><div className="field full"><label>Password</label><input name="password" type="password" minLength="6" required/></div><div className="full"><button className="btn primary">Create Account</button></div></form></div></section>:<section className="wrap"><div className="row space"><h2>{profile?.name||user.email}</h2><button className="btn secondary" onClick={()=>signOut(auth)}>Sign Out</button></div><div className="metric-grid"><div className="metric">Orders<strong>{orders.length}</strong></div><div className="metric">Punches<strong>{profile?.loyaltyPunches||0}</strong></div><div className="metric">Rewards<strong>{profile?.availableRewards||0}</strong></div><div className="metric">Role<strong style={{fontSize:18}}>{profile?.role||"customer"}</strong></div></div></section>;
 const Rewards=()=> <section className="wrap"><h2>Cray-Zee Loyalty Card</h2><div className="card">{!user?<p>Sign in to view your rewards.</p>:<><div className="punches">{Array.from({length:10},(_,i)=><div className={`punch ${i<(profile?.loyaltyPunches||0)?"on":""}`} key={i}>{i<(profile?.loyaltyPunches||0)?"★":i+1}</div>)}</div><div className="notice">{profile?.availableRewards||0} rewards available</div></>}</div></section>;
 const Orders=()=> <section className="wrap">
   <div className="eyebrow">My account</div>
   <h2>Order History</h2>
   {!user ? (
     <div className="card"><p>Please sign in to view your orders.</p></div>
   ) : (
     <div>
       {orders.length ? orders.map(o =>
         <div className="card" key={o.id} style={{marginBottom:18}}>
           <div className="row space">
             <div>
               <h3 style={{marginBottom:4}}>{o.orderNumber || o.id}</h3>
               <div className="muted">{o.customerEmail || user.email}</div>
             </div>
             <span className="status">{o.status || "Paid"}</span>
           </div>

           <div style={{marginTop:15}}>
             {(o.items || []).length ? (o.items || []).map((item,index)=>
               <div className="item row space" key={`${o.id}-customer-item-${index}`}>
                 <div>
                   <b>{item.name || "Product"}</b>
                   <div className="muted">Quantity: {item.quantity || 0}</div>
                 </div>
                 <div style={{textAlign:"right"}}>
                   {item.unitAmount != null && <div>{money(item.unitAmount)} each</div>}
                   <b>{money(item.amountTotal || 0)}</b>
                 </div>
               </div>
             ) : <p className="muted">Item details are not available for this order.</p>}
           </div>

           <div className="grid g2" style={{marginTop:15}}>
             <div>
               <h4>Order Total</h4>
               <div className="price">{money(o.total || 0)}</div>
               <p className="muted">Payment: {o.paymentStatus || "—"}</p>
             </div>
             <div>
               <h4>Shipping / Tracking</h4>
               {o.trackingNumber ? (
                 <>
                   <p><b>{o.carrier || "Carrier"}:</b> {o.trackingNumber}</p>
                   {o.trackingUrl &&
                     <p><a href={o.trackingUrl} target="_blank" rel="noreferrer">Track package</a></p>
                   }
                 </>
               ) : <p className="muted">Tracking will appear here once your order ships.</p>}
             </div>
           </div>

           {o.shippingAddress &&
             <details style={{marginTop:10}}>
               <summary style={{cursor:"pointer",fontWeight:700}}>Shipping address</summary>
               <p style={{lineHeight:1.6}}>
                 {o.shippingAddress.line1 || ""}
                 {o.shippingAddress.line2 && <><br/>{o.shippingAddress.line2}</>}
                 <br/>
                 {o.shippingAddress.city || ""}
                 {o.shippingAddress.city && o.shippingAddress.state ? ", " : ""}
                 {o.shippingAddress.state || ""} {o.shippingAddress.postalCode || ""}
                 <br/>
                 {o.shippingAddress.country || ""}
               </p>
             </details>
           }
         </div>
       ) : <div className="card"><p className="muted">No orders yet.</p></div>}
     </div>
   )}
 </section>;
 const Custom=()=> <section className="wrap"><h2>Custom Order</h2>{!user?<div className="card"><p>Sign in first.</p></div>:<form className="card form" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);await addDoc(collection(db,"customRequests"),{userId:user.uid,email:user.email,type:f.get("type"),quantity:Number(f.get("quantity")||1),size:f.get("size"),colors:f.get("colors"),wording:f.get("wording"),details:f.get("details"),status:"Request Received",createdAt:serverTimestamp()});e.currentTarget.reset();notify("Custom request submitted")}}><div className="field"><label>Product</label><select name="type"><option>Custom Shirt</option><option>Custom Tumbler</option><option>Custom Graphic</option><option>Other</option></select></div><div className="field"><label>Quantity</label><input name="quantity" type="number" defaultValue="1"/></div><div className="field"><label>Size</label><input name="size"/></div><div className="field"><label>Colors</label><input name="colors"/></div><div className="field full"><label>Wording</label><input name="wording"/></div><div className="field full"><label>Details</label><textarea name="details" required/></div><div className="full"><button className="btn primary">Submit</button></div></form>}</section>;
 const Cart=()=> <section className="wrap"><h2>Cart</h2><div className="card">{cart.length?cart.map((i,n)=>{const p=all.find(x=>x.id===i.id);return p?<div className="item row space" key={n}><div><b>{p.name}</b><div className="price">{money(price(p)*i.qty)}</div></div><div><button className="btn secondary" onClick={()=>setCart(c=>c.map((x,j)=>j===n?{...x,qty:Math.max(1,x.qty-1)}:x))}>−</button> {i.qty} <button className="btn secondary" onClick={()=>setCart(c=>c.map((x,j)=>j===n?{...x,qty:x.qty+1}:x))}>+</button></div></div>:null}):<p className="muted">Cart is empty.</p>}<h3>Total: {money(subtotal)}</h3>{cart.length>0&&<><button className="btn primary" disabled={checkoutLoading} onClick={beginCheckout}>{checkoutLoading?"Opening secure checkout...":"Secure Checkout"}</button><p className="muted">Payments are processed securely by Stripe.</p></>}</div></section>;
 const Admin=()=> profile?.role!=="admin"
 ? <section className="wrap"><div className="card">Admin access required.</div></section>
 : <section className="wrap">
    <div className="eyebrow">Owner dashboard</div>
    <div className="row space">
      <h2>Business Dashboard</h2>
      <span className="status">Admin</span>
    </div>

    <div className="metric-grid">
      <div className="metric"><small>Products</small><strong>{products.length}</strong></div>
      <div className="metric"><small>Customers</small><strong>{users.length}</strong></div>
      <div className="metric"><small>Custom Requests</small><strong>{requests.length}</strong></div>
      <div className="metric"><small>Orders</small><strong>{adminOrders.length}</strong></div>
    </div>

    <div className="tabs" style={{marginTop:18}}>
      {["dashboard","products","orders","requests","customers"].map(t=>
        <button key={t} className={adminTab===t?"active":""}
          onClick={()=>{setAdminTab(t);setEditing(null)}}>
          {t==="requests"?"Custom Requests":t[0].toUpperCase()+t.slice(1)}
        </button>
      )}
    </div>

    {adminTab==="dashboard" &&
      <div className="grid g2">
        <div className="card">
          <h3>Order Summary</h3>
          <div className="item row space"><span>Paid</span><b>{adminOrders.filter(o=>o.status==="Paid").length}</b></div>
          <div className="item row space"><span>Designing</span><b>{adminOrders.filter(o=>o.status==="Designing").length}</b></div>
          <div className="item row space"><span>Ready for Pickup</span><b>{adminOrders.filter(o=>o.status==="Ready for Pickup").length}</b></div>
          <div className="item row space"><span>Completed</span><b>{adminOrders.filter(o=>o.status==="Completed").length}</b></div>
        </div>
        <div className="card">
          <h3>Revenue</h3>
          <div className="price">{money(adminOrders.reduce((sum,o)=>sum+(Number(o.total)||0),0))}</div>
          <p className="muted">Based on orders currently saved in Firestore.</p>
        </div>
      </div>
    }

    {adminTab==="products" &&
      <div className="grid g2">
        <form className="card form" onSubmit={async e=>{
          e.preventDefault();
          const f=new FormData(e.currentTarget);
          const data={
            name:f.get("name"),
            category:f.get("category"),
            emoji:f.get("emoji")||"🎨",
            price:Math.round(Number(f.get("price")||0)*100),
            salePrice:Math.round(Number(f.get("salePrice")||0)*100),
            description:f.get("description"),
            sizes:f.get("sizes"),
            colors:f.get("colors"),
            imageUrl:f.get("imageUrl"),
            active:f.get("active")==="on",
            featured:f.get("featured")==="on",
            updatedAt:serverTimestamp()
          };
          if(editing?.id) await updateDoc(doc(db,"products",editing.id),data);
          else await addDoc(collection(db,"products"),{...data,createdAt:serverTimestamp()});
          setEditing(null);
          notify("Product saved");
        }}>
          <h3 className="full">{editing?"Edit":"Add"} Product</h3>
          <div className="field full"><label>Name</label><input name="name" defaultValue={editing?.name||""} required/></div>
          <div className="field"><label>Category</label><input name="category" defaultValue={editing?.category||"T-Shirts"}/></div>
          <div className="field"><label>Emoji</label><input name="emoji" defaultValue={editing?.emoji||"🎨"}/></div>
          <div className="field"><label>Price</label><input name="price" type="number" step=".01" defaultValue={editing?.price?(editing.price/100).toFixed(2):""}/></div>
          <div className="field"><label>Sale Price</label><input name="salePrice" type="number" step=".01" defaultValue={editing?.salePrice?(editing.salePrice/100).toFixed(2):""}/></div>
          <div className="field full"><label>Description</label><textarea name="description" defaultValue={editing?.description||""}/></div>
          <div className="field"><label>Sizes</label><input name="sizes" defaultValue={editing?.sizes||""}/></div>
          <div className="field"><label>Colors</label><input name="colors" defaultValue={editing?.colors||""}/></div>
          <div className="field full"><label>Image URL</label><input name="imageUrl" defaultValue={editing?.imageUrl||""}/></div>
          <label><input style={{width:"auto"}} type="checkbox" name="active" defaultChecked={editing?editing.active!==false:true}/> Show in shop</label>
          <label><input style={{width:"auto"}} type="checkbox" name="featured" defaultChecked={editing?.featured||false}/> Featured</label>
          <div className="full"><button className="btn primary">Save Product</button></div>
        </form>

        <div className="card">
          <h3>Catalog</h3>
          {products.length?products.map(p=>
            <div className="item" key={p.id}>
              <div className="row space">
                <div><b>{p.name}</b><div className="muted">{p.category} • {money(p.price)}</div></div>
                <div className="row">
                  <button className="btn secondary" onClick={()=>setEditing(p)}>Edit</button>
                  <button className="btn danger" onClick={async()=>{
                    if(confirm(`Delete ${p.name}?`)) await deleteDoc(doc(db,"products",p.id));
                  }}>Delete</button>
                </div>
              </div>
            </div>
          ):<p className="muted">No products yet.</p>}
        </div>
      </div>
    }

    {adminTab==="orders" &&
      <div className="card">
        <h3>Orders</h3>
        {adminOrders.length ? adminOrders.map(o =>
          <div className="item" key={o.id} style={{marginBottom:28}}>
            <div className="row space">
              <div>
                <h3 style={{marginBottom:4}}>{o.orderNumber || o.id}</h3>
                <div className="muted">{o.customerName || "Customer"}</div>
                <div className="muted">{o.customerEmail || ""}</div>
                {o.customerPhone && <div className="muted">{o.customerPhone}</div>}
              </div>

              <select
                value={o.status || "Paid"}
                onChange={e => updateAdminOrder(o,{status:e.target.value})}
              >
                <option>Paid</option>
                <option>Designing</option>
                <option>Waiting for Approval</option>
                <option>Ready for Pickup</option>
                <option>Shipped</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>

            <div style={{marginTop:18}}>
              <h4>Items Purchased</h4>
              {(o.items || []).length ? (o.items || []).map((item,index) =>
                <div className="item row space" key={`${o.id}-item-${index}`}>
                  <div>
                    <b>{item.name || "Product"}</b>
                    <div className="muted">Quantity: {item.quantity || 0}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {item.unitAmount != null && <div>{money(item.unitAmount)} each</div>}
                    <div className="price" style={{fontSize:18}}>
                      {money(item.amountTotal || 0)}
                    </div>
                  </div>
                </div>
              ) : <p className="muted">No item details were saved for this order.</p>}
            </div>

            <div className="grid g2" style={{marginTop:18}}>
              <div className="card">
                <h4>Shipping Address</h4>
                {o.shippingAddress ? (
                  <p style={{lineHeight:1.6}}>
                    {o.shippingAddress.line1 || ""}
                    {o.shippingAddress.line2 && <><br/>{o.shippingAddress.line2}</>}
                    <br/>
                    {o.shippingAddress.city || ""}
                    {o.shippingAddress.city && o.shippingAddress.state ? ", " : ""}
                    {o.shippingAddress.state || ""} {o.shippingAddress.postalCode || ""}
                    <br/>
                    {o.shippingAddress.country || ""}
                  </p>
                ) : <p className="muted">No shipping address saved.</p>}

                <h4>Tracking</h4>
                <div className="field">
                  <label>Carrier</label>
                  <input
                    id={`carrier-${o.id}`}
                    defaultValue={o.carrier || ""}
                    placeholder="USPS, UPS, FedEx..."
                  />
                </div>
                <div className="field">
                  <label>Tracking Number</label>
                  <input
                    id={`tracking-${o.id}`}
                    defaultValue={o.trackingNumber || ""}
                    placeholder="Tracking number"
                  />
                </div>
                <div className="field">
                  <label>Tracking URL</label>
                  <input
                    id={`tracking-url-${o.id}`}
                    defaultValue={o.trackingUrl || ""}
                    placeholder="https://..."
                  />
                </div>
                <button className="btn primary" style={{marginTop:10}} onClick={()=>{
                  const carrier=document.getElementById(`carrier-${o.id}`)?.value||"";
                  const trackingNumber=document.getElementById(`tracking-${o.id}`)?.value||"";
                  const trackingUrl=document.getElementById(`tracking-url-${o.id}`)?.value||"";
                  updateAdminOrder(o,{
                    carrier,
                    trackingNumber,
                    trackingUrl,
                    status:trackingNumber ? "Shipped" : (o.status || "Paid")
                  });
                }}>Save Tracking</button>
              </div>

              <div className="card">
                <h4>Payment</h4>
                <div className="row space">
                  <span>Subtotal</span>
                  <b>{money(o.subtotal || 0)}</b>
                </div>
                <div className="row space" style={{marginTop:8}}>
                  <span>Total</span>
                  <span className="price">{money(o.total || 0)}</span>
                </div>
                <p><b>Payment Status:</b> {o.paymentStatus || "—"}</p>
                <p className="muted" style={{overflowWrap:"anywhere"}}>
                  <b>Payment Intent:</b><br/>{o.paymentIntentId || "—"}
                </p>
              </div>
            </div>

            <details style={{marginTop:16}}>
              <summary style={{cursor:"pointer",fontWeight:700}}>Stripe / Technical Details</summary>
              <p className="muted" style={{overflowWrap:"anywhere"}}>
                <b>Stripe Session:</b><br/>{o.stripeSessionId || "—"}
              </p>
              <p className="muted" style={{overflowWrap:"anywhere"}}>
                <b>Firebase User ID:</b><br/>{o.userId || "—"}
              </p>
            </details>
          </div>
        ) : <p className="muted">No orders have been saved yet.</p>}
      </div>
    }

    {adminTab==="requests" &&
      <div className="card">
        <h3>Custom Requests</h3>
        {requests.length?requests.map(r=>
          <div className="item" key={r.id}>
            <div className="row space">
              <div><b>{r.type||"Custom Request"}</b><div className="muted">{r.email||""} • Qty {r.quantity||1}</div></div>
              <select value={r.status||"Request Received"} onChange={e=>
                updateDoc(doc(db,"customRequests",r.id),{status:e.target.value,updatedAt:serverTimestamp()})
              }>
                <option>Request Received</option><option>Reviewing</option><option>Designing</option>
                <option>Waiting for Approval</option><option>Approved</option><option>In Production</option>
                <option>Ready for Pickup</option><option>Completed</option>
              </select>
            </div>
            <p><b>Size:</b> {r.size||"—"} &nbsp; <b>Colors:</b> {r.colors||"—"}</p>
            <p><b>Wording:</b> {r.wording||"—"}</p><p>{r.details||""}</p>
          </div>
        ):<p className="muted">No custom requests yet.</p>}
      </div>
    }

    {adminTab==="customers" &&
      <div className="card">
        <h3>Customers & Loyalty</h3>
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Punches</th><th>Rewards</th><th>Adjust</th></tr></thead>
          <tbody>{users.map(u=>
            <tr key={u.id}>
              <td>{u.name||""}</td><td>{u.email||""}</td>
              <td>{u.loyaltyPunches||0}</td><td>{u.availableRewards||0}</td>
              <td><div className="row">
                <button className="btn secondary" onClick={()=>updateDoc(doc(db,"users",u.id),{loyaltyPunches:Math.max(0,Number(u.loyaltyPunches||0)+1)})}>+ Punch</button>
                <button className="btn secondary" onClick={()=>updateDoc(doc(db,"users",u.id),{loyaltyPunches:Math.max(0,Number(u.loyaltyPunches||0)-1)})}>− Punch</button>
                <button className="btn secondary" onClick={()=>updateDoc(doc(db,"users",u.id),{availableRewards:Math.max(0,Number(u.availableRewards||0)+1)})}>+ Reward</button>
                <button className="btn secondary" onClick={()=>updateDoc(doc(db,"users",u.id),{availableRewards:Math.max(0,Number(u.availableRewards||0)-1)})}>− Reward</button>
              </div></td>
            </tr>
          )}</tbody>
        </table>
      </div>
    }
  </section>;

 const pages={home:<Home/>,shop:<ShopPage live={live} search={search} setSearch={setSearch} category={category} setCategory={setCategory} sort={sort} setSort={setSort} shopItems={shopItems} add={add}/>,account:<Account/>,rewards:<Rewards/>,orders:<Orders/>,custom:<Custom/>,cart:<Cart/>,admin:<Admin/>};
 return <><header><div className="brand" onClick={()=>nav("home")}><img src="/assets/kristys-logo.png"/><span>Kristy's Cray-Zee Crafts</span></div><div className="nav"><button onClick={()=>nav("shop")}>Shop</button><button onClick={()=>nav("custom")}>Custom Order</button><button onClick={()=>nav("rewards")}>Rewards</button><button onClick={()=>nav("orders")}>Orders</button>{profile?.role==="admin"&&<button onClick={()=>nav("admin")}>Admin</button>}<button onClick={()=>nav("account")}>{user?"Account":"Sign In"}</button><button onClick={()=>nav("cart")}>Cart <span className="badge">{cart.reduce((s,x)=>s+x.qty,0)}</span></button></div></header><main>{pages[route]||pages.home}</main><footer><img src="/assets/kristys-logo.png"/><div><b>Kristy's Cray-Zee Crafts</b><div>Made with creativity. Crafted with care.</div></div></footer>{message&&<div className="toast">{message}</div>}</>;
}
createRoot(document.getElementById("root")).render(<App/>);
