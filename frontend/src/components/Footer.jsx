import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white pt-20 pb-10 mt-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="text-3xl font-black italic tracking-tighter hover:opacity-80 transition">
              WearItNow
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Revolutionizing fashion with AI-powered virtual try-on. Wear your confidence with our curated premium collections.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: <Instagram size={18} />, label: 'Instagram' },
                { icon: <Facebook size={18} />, label: 'Facebook' },
                { icon: <Twitter size={18} />, label: 'Twitter' },
                { icon: <Youtube size={18} />, label: 'Youtube' }
              ].map((social, i) => (
                <a 
                  key={i}
                  href="#" 
                  className="h-10 w-10 rounded-full border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-all duration-300"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-white">Collections</h3>
            <ul className="space-y-4">
              {[
                { name: 'Latest Arrivals', path: '/shop' },
                { name: 'Thrift Shop', path: '/thrift' },
                { name: 'Virtual Gallery', path: '/try-on' },
                { name: 'Best Sellers', path: '/shop?category=Best%20Selling' },
                { name: 'Outerwear', path: '/shop?category=Outerwear' }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-gray-400 hover:text-white transition flex items-center group text-sm font-medium"
                  >
                    <ChevronRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-white">Customer Care</h3>
            <ul className="space-y-4">
              {[
                { name: 'Shipping Policy', path: '#' },
                { name: 'Returns & Exchanges', path: '#' },
                { name: 'Track Order', path: '/buyer' },
                { name: 'Become a Seller', path: '/become-seller' },
                { name: 'Privacy Policy', path: '#' }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-gray-400 hover:text-white transition flex items-center group text-sm font-medium"
                  >
                    <ChevronRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-white">Join the Circle</h3>
            <p className="text-gray-400 text-sm mb-6 font-medium">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="relative group">
              <input 
                type="email" 
                placeholder="email@example.com"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-gray-600"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-white text-black rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <ArrowRight size={18} />
              </button>
            </form>
            <div className="mt-8 flex items-center gap-4 opacity-30 grayscale hover:opacity-60 transition duration-500">
               <CreditCard size={32} />
               <span className="text-[10px] font-black uppercase tracking-tighter">eSewa Verified</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            &copy; {currentYear} WearItNow Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-[11px] font-black text-gray-500 uppercase tracking-widest">
            <Link to="#" className="hover:text-white transition">Terms</Link>
            <Link to="#" className="hover:text-white transition">Cookies</Link>
            <Link to="#" className="hover:text-white transition">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
