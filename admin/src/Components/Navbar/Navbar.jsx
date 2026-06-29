import React from 'react'
import './navbar.css'
import navlogo from '../../assets/nav-logo.svg'
import navProfile from '../../assets/profile.jpg'

const Navbar = () => {
  return (
    <div className='navbar'>
        <img src={navlogo} alt="" className="nav-logo" />
        <img src={navProfile} alt="profile" className='nav-profile' alt="" />
    </div>
  )
}

export default Navbar