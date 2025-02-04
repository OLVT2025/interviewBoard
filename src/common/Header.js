import React from "react";
import img from '../assests/comp_logo.png';

const Header=()=>{
    return (
        <div style={{backgroundColor:'#F6F6F6',padding:'20px',display:'flex',alignItems:'center',paddingLeft:'60px',paddingRight:'60px',paddingBottom:'0px'}}>
            <img src={img} alt="img" style={{width:'80px',height:'80px'}}/>
            {/* <div style={{color:'#F15D27',fontWeight:700,fontSize:'24px'}}>Orange League</div> */}
        </div>
    );
};
export default Header;