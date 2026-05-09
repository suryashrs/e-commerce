import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { 
    Users, 
    Search, 
    Edit, 
    Trash2, 
    ShieldAlert, 
    User, 
    ShoppingBag, 
    ShieldCheck,
    X,
    Filter,
    MoreVertical,
    Clock,
    Mail
} from "lucide-react";

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/users.php`);
            setUsers(response.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.")) return;
        
        setActionLoading(id);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/user_delete.php`, { id });
            if (res.data.status === 200) {
                setUsers(prev => prev.filter(u => u.id !== id));
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete user.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setActionLoading(editingUser.id);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/user_update.php`, editingUser);
            if (res.data.status === 200) {
                setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
                setIsEditModalOpen(false);
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to update user.");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (user.shop_name && user.shop_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleIcon = (role) => {
        if (role === 'admin') return <ShieldCheck className="text-rose-500" size={14} />;
        if (role === 'seller') return <ShoppingBag className="text-indigo-500" size={14} />;
        return <User className="text-emerald-500" size={14} />;
    };

    return (
        <div className="p-8 space-y-6 animate-fade-in-up">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <Users className="text-indigo-500" size={24} />
                        Account Control Center
                    </h1>
                    <p className="text-gray-400 mt-1 uppercase text-[9px] font-black tracking-[0.2em]">Global User & Merchant Directory</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Role Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-gray-800/50 border border-white/5 text-white pl-10 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-[10px] font-black appearance-none transition-all w-full sm:w-40"
                        >
                            <option value="all">Every Account</option>
                            <option value="seller">Merchants</option>
                            <option value="buyer">Shoppers</option>
                            <option value="admin">Administrators</option>
                        </select>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input 
                            type="text"
                            placeholder="Find ID, name, or mail..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-800/40 border border-white/5 text-white pl-12 pr-4 py-2 rounded-xl w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-xs"
                        />
                    </div>
                </div>
            </header>

            {/* User Grid Table */}
            <div className="bg-gray-800/20 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">UID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Profile Identity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Access Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Shop Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Joined On</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto mb-4"></div>
                                        <p className="text-xs font-black text-gray-500 animate-pulse uppercase tracking-widest">Syncing Data...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black text-gray-600 bg-black/40 px-3 py-1 rounded-lg border border-white/5">#{user.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-[10px] font-black text-white">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-xs tracking-tight">{user.name}</p>
                                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                        <Mail size={10} /> {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getRoleIcon(user.role)}
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                    user.role === 'admin' ? 'text-rose-500' : 
                                                    user.role === 'seller' ? 'text-indigo-500' : 'text-emerald-500'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role === 'seller' ? (
                                                <div className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full w-fit border ${
                                                    user.shop_status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    user.shop_status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}>
                                                    <div className={`w-1 h-1 rounded-full ${
                                                        user.shop_status === 'approved' ? 'bg-emerald-500' :
                                                        user.shop_status === 'pending' ? 'bg-amber-500' :
                                                        'bg-rose-50'
                                                    }`} />
                                                    {user.shop_status}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold">
                                                <Clock size={10} />
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setEditingUser({...user}); setIsEditModalOpen(true); }}
                                                    className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading === user.id ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-32 text-center">
                                        <ShieldAlert size={48} className="text-gray-700 mx-auto mb-4" />
                                        <p className="text-lg font-black text-gray-600">No matching accounts found</p>
                                        <button onClick={() => { setSearchQuery(""); setRoleFilter("all"); }} className="text-indigo-500 text-xs font-black uppercase tracking-widest mt-4 hover:underline">Clear all filters</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 pointer-events-none">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500 pointer-events-auto" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="relative bg-gray-900 border border-white/10 w-full max-w-xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 pointer-events-auto">
                        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Edit Account</h3>
                                <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mt-1">Profile Overwrite Center</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateUser} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-sans">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                                    <input 
                                        type="text"
                                        value={editingUser.name}
                                        onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                        className="w-full bg-gray-800/50 border border-transparent focus:border-indigo-500/50 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                                    <input 
                                        type="email"
                                        value={editingUser.email}
                                        onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                        className="w-full bg-gray-800/50 border border-transparent focus:border-indigo-500/50 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Access Level</label>
                                    <select 
                                        value={editingUser.role}
                                        onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                        className="w-full bg-gray-800/50 border border-transparent focus:border-indigo-500/50 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:outline-none transition-all shadow-inner appearance-none"
                                    >
                                        <option value="buyer">Shopper (Buyer)</option>
                                        <option value="seller">Merchant (Seller)</option>
                                        <option value="admin">System Root (Admin)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Shop Approval</label>
                                    <select 
                                        value={editingUser.shop_status}
                                        onChange={(e) => setEditingUser({...editingUser, shop_status: e.target.value})}
                                        className="w-full bg-gray-800/50 border border-transparent focus:border-indigo-500/50 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:outline-none transition-all shadow-inner appearance-none"
                                    >
                                        <option value="none">No Shop</option>
                                        <option value="pending">Review Required</option>
                                        <option value="approved">Verified Merchant</option>
                                        <option value="suspended">Suspended / Banned</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={actionLoading === editingUser.id}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                            >
                                {actionLoading === editingUser.id ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" /> : "Commit Account Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
