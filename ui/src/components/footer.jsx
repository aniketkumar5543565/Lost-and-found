import React from 'react'

const footer = () => {
  return (
        /* footer */
        <div className="container mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Lost & Found</h3>
                      <p className="text-gray-400 text-sm">
                        Helping you reconnect with your lost items or find owners for found treasures.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                      <ul className="space-y-2">
                        <li>
                          <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link to="/report" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                            Report Item
                          </Link>
                        </li>
                        <li>
                          <Link to="/claim" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                            Claim Item
                          </Link>
                        </li>
                        <li>
                          <Link to="/profile" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                            Profile
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Contact</h3>
                      <p className="text-gray-400 text-sm">Email: support@lostfound.com</p>
                      <p className="text-gray-400 text-sm">Phone: (123) 456-7890</p>
                    </div>
                  </div>
                  <div className="mt-8 border-t border-gray-700 pt-4 text-center">
                    <p className="text-gray-400 text-sm">
                      © {new Date().getFullYear()} Lost &amp; Found. All rights reserved.
                    </p>
                  </div>
                </div>
                
  )
}

export default footer