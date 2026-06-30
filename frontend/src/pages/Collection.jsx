import React, { useContext } from 'react'
import { ShopContext } from '../Context/ShopContext'

export default function Collection() {

    const {products}= useContext(ShopContext);
  return (
    <div className='flex flex-col sm:flex-row gap-1 fm:gap-10 pt-10 border-t'>
        Collection
    </div>
  )
}
