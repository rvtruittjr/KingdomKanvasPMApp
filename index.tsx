import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
    Layout, Folder, Layers, Settings, Bell,
    Plus, Search, ChevronRight, Clock,
    CheckCircle2, ArrowLeft, Image as ImageIcon,
    FileText, MessageSquare, Download, Users,
    Grid, Building2, LogOut, CalendarDays,
    X, MoreHorizontal, Tag, Paperclip, Package,
    File as FileIcon, FileCheck, Send, Activity,
    Calendar, AlertCircle, Printer, Smartphone,
    Link as LinkIcon, ChevronDown, PauseCircle,
    PlayCircle, CheckSquare, AlertTriangle,
    Mail, Shield, Trash2, Edit2, BellRing,
    CreditCard, Globe, Lock, Menu, ChevronLeft,
    Github, Loader2, Filter
} from "lucide-react";

// Import database functions
import {
    getOrganizations,
    createProject,
    updateProjectStatus,
    addProjectActivity,
    initializeDatabase,
    type Organization as DBOrganization,
    type Project as DBProject,
    type ActivityItem as DBActivityItem
} from './db';

// --- Types ---

type Role = 'designer' | 'client';
type ProjectStatus = 'ready' | 'in-progress' | 'on-hold' | 'review' | 'completed';
type TeamRole = 'Project Manager' | 'Creative Director' | 'Designer' | 'Client';
type ActivityType = 'message' | 'upload' | 'status';

interface User {
    id: string;
    name: string;
    email: string;
    image: string;
    role: Role; 
}

interface TeamMember {
    id: string;
    name: string;
    role: TeamRole;
    avatar: string;
    email: string;
    status: 'active' | 'invited';
}

interface ActivityItem {
    id: string;
    type: ActivityType;
    userId: string;
    userName: string;
    userAvatar: string;
    timestamp: string;
    content: string;
    file?: {
        name: string;
        size: string;
        type: string;
    };
}

interface Project {
    id: string;
    title: string;
    type: 'sermon-series' | 'event' | 'branding' | 'social-media' | 'print' | 'other';
    status: ProjectStatus;
    createdAt: string;
    conceptDueDate: string;
    finalDueDate: string;
    thumbnail?: string;
    description: string;
    department?: string;
    referenceLink?: string;
    team: TeamMember[];
    activity: ActivityItem[];
}

interface Organization {
    id: string;
    name: string;
    logo: string;
    plan: 'standard' | 'pro';
    projects: Project[];
}

// --- Auth Context & Mock ---

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (provider: string, email?: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

// --- Mock Data ---

const MOCK_TEAM_MEMBERS: TeamMember[] = [
    { id: 'u1', name: 'Alex Johnson', role: 'Project Manager', email: 'alex@kingdomkanvas.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', status: 'active' },
    { id: 'u2', name: 'Sarah Chen', role: 'Creative Director', email: 'sarah@kingdomkanvas.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'active' },
    { id: 'u3', name: 'Mike Ross', role: 'Designer', email: 'mike@kingdomkanvas.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', status: 'active' },
    { id: 'u4', name: 'Jessica Day', role: 'Designer', email: 'jess@kingdomkanvas.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica', status: 'invited' },
    { id: 'u5', name: 'Pastor Dave', role: 'Client', email: 'dave@gracecommunity.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave', status: 'active' }
];

const MOCK_ORGS: Organization[] = [
    {
        id: 'org1',
        name: 'Grace Community',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=GC&backgroundColor=0a0a0a',
        plan: 'pro',
        projects: [
            {
                id: 'p1',
                title: 'Summer of Hope',
                type: 'sermon-series',
                status: 'in-progress',
                createdAt: 'May 15',
                conceptDueDate: 'May 22',
                finalDueDate: 'June 01',
                description: 'A 6-week visual series focusing on hope in modern times. Needs cinematic title slides and social squares.',
                team: MOCK_TEAM_MEMBERS,
                activity: [
                    {
                        id: 'a1',
                        type: 'message',
                        userId: 'u5',
                        userName: 'Pastor Dave',
                        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave',
                        timestamp: '2 hours ago',
                        content: 'Hey team, just saw the initial concepts. The "Dawn" direction is definitely our favorite. Could we see it with slightly warmer tones?'
                    },
                    {
                        id: 'a2',
                        type: 'upload',
                        userId: 'u3',
                        userName: 'Mike Ross',
                        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
                        timestamp: '4 hours ago',
                        content: 'Concept_Sketches_v2.pdf',
                        file: { name: 'Concept_Sketches_v2.pdf', size: '4.5 MB', type: 'pdf' }
                    },
                    {
                        id: 'a3',
                        type: 'status',
                        userId: 'u1',
                        userName: 'Alex Johnson',
                        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
                        timestamp: 'Yesterday',
                        content: 'changed status to In Production'
                    },
                    {
                        id: 'a4',
                        type: 'message',
                        userId: 'u2',
                        userName: 'Sarah Chen',
                        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                        timestamp: 'Yesterday',
                        content: 'Thanks Dave! We will explore those warmer tones today. Mike is already on it.'
                    }
                ]
            },
            {
                id: 'p2',
                title: 'Easter 2024',
                type: 'event',
                status: 'completed',
                createdAt: 'Feb 20',
                conceptDueDate: 'March 10',
                finalDueDate: 'March 31',
                description: 'Full print and digital package for Easter services.',
                team: [MOCK_TEAM_MEMBERS[0], MOCK_TEAM_MEMBERS[2], MOCK_TEAM_MEMBERS[4]],
                activity: []
            }
        ]
    },
    {
        id: 'org2',
        name: 'Elevation City',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=EC&backgroundColor=FACC15',
        plan: 'standard',
        projects: [
            {
                id: 'p3',
                title: 'Youth Night Refresh',
                type: 'branding',
                status: 'review',
                createdAt: 'Sep 20',
                conceptDueDate: 'Oct 01',
                finalDueDate: 'Oct 15',
                description: 'Rebranding the Wednesday night youth experience.',
                team: [MOCK_TEAM_MEMBERS[1], { ...MOCK_TEAM_MEMBERS[4], name: 'Josh Miller' }],
                activity: []
            }
        ]
    }
];

// --- Helpers ---

const formatDate = (dateStr: string) => {
    // Handle "TBD" or empty dates
    if (!dateStr || dateStr === 'TBD') return 'TBD';
    
    // Try to parse the date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        // If it's already in a good format, return as is
        return dateStr;
    }
    
    // Format as "Month Day, Year" (e.g., "Jan 23, 26")
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    
    return `${month} ${day}, ${year}`;
};

const getStatusInfo = (status: ProjectStatus) => {
    switch (status) {
        case 'ready':
            return { label: 'Ready for Production', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', icon: CheckSquare };
        case 'in-progress':
            return { label: 'In Production', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: PlayCircle };
        case 'on-hold':
            return { label: 'On Hold', color: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: PauseCircle };
        case 'review':
            return { label: 'In Review', color: 'bg-kingdom-yellow/30 text-yellow-800', dot: 'bg-yellow-500', icon: AlertTriangle };
        case 'completed':
            return { label: 'Complete', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: CheckCircle2 };
        default:
            return { label: 'Unknown', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', icon: AlertCircle };
    }
};

// --- Components ---

const StatusBadge = ({ status, className = "" }: { status: ProjectStatus, className?: string }) => {
    const info = getStatusInfo(status);
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${info.color} ${className}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${info.dot}`}></div>
            {info.label}
        </span>
    );
};

const StatusSelect = ({ status, onChange }: { status: ProjectStatus, onChange: (s: ProjectStatus) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const info = getStatusInfo(status);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const statuses: ProjectStatus[] = ['ready', 'in-progress', 'on-hold', 'review', 'completed'];

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${isOpen ? 'ring-2 ring-kingdom-black/10' : ''} ${info.color} hover:brightness-95`}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${info.dot}`}></div>
                {info.label}
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fade-in overflow-hidden">
                    {statuses.map((s) => {
                        const sInfo = getStatusInfo(s);
                        return (
                            <button
                                key={s}
                                onClick={() => {
                                    onChange(s);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 flex items-center gap-3 transition-colors ${status === s ? 'bg-gray-50 text-kingdom-black' : 'text-gray-600'}`}
                            >
                                <sInfo.icon size={16} className={status === s ? 'text-black' : 'text-gray-400'} />
                                {sInfo.label}
                                {status === s && <CheckCircle2 size={14} className="ml-auto text-kingdom-black" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const TeamAvatarGroup = ({ title, members }: { title: string, members: TeamMember[] }) => {
    if (members.length === 0) return null;
    return (
        <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
            <div className="flex -space-x-3">
                {members.map(m => (
                    <div key={m.id} className="relative group/avatar">
                        <img 
                           src={m.avatar} 
                           alt={m.name}
                           className="w-10 h-10 rounded-full border-2 border-white object-cover bg-gray-100 transition-transform hover:scale-110 hover:z-10 relative z-0" 
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                            {m.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Pages ---

const TeamPage = () => {
    return (
        <div className="p-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="font-display font-bold text-3xl mb-1">Team</h1>
                    <p className="text-gray-500">Manage your workspace access and roles.</p>
                </div>
                <button className="bg-kingdom-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg shadow-black/20 w-full sm:w-auto justify-center">
                    <Plus size={18} /> Invite Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_TEAM_MEMBERS.map(member => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                             <button className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-black transition-colors">
                                <Edit2 size={16} />
                             </button>
                             <button className="p-2 bg-gray-50 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                             </button>
                        </div>
                        
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <img src={member.avatar} alt={member.name} className="w-24 h-24 rounded-full border-4 border-gray-50 object-cover" />
                                <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            </div>
                            <h3 className="font-bold text-xl text-gray-900 mb-1">{member.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{member.role}</p>
                            
                            <div className="w-full pt-4 border-t border-gray-100 flex flex-col gap-2">
                                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg justify-center">
                                    <Mail size={14} />
                                    <span className="truncate">{member.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-gray-400 bg-gray-50 p-2 rounded-lg justify-center">
                                    <Shield size={14} />
                                    <span>{member.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                <button className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-kingdom-black hover:text-kingdom-black hover:bg-gray-50 transition-all cursor-pointer min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-inherit">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold">Invite New Member</span>
                </button>
            </div>
        </div>
    );
};

const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'notifications', label: 'Notifications', icon: BellRing },
        { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
        { id: 'integrations', label: 'Integrations', icon: Globe },
    ];

    return (
        <div className="p-4 md:p-8 animate-fade-in max-w-6xl mx-auto h-[calc(100vh-80px)] overflow-hidden flex flex-col">
             <div className="mb-8">
                <h1 className="font-display font-bold text-3xl mb-1">Settings</h1>
                <p className="text-gray-500">Manage your account preferences and workspace settings.</p>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-white text-black shadow-sm' 
                                : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {activeTab === 'general' && (
                        <div className="max-w-xl space-y-8 animate-fade-in">
                            <div>
                                <h3 className="font-bold text-lg mb-6">Profile Details</h3>
                                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
                                    <div className="relative group cursor-pointer">
                                        <img src={user?.image} className="w-24 h-24 rounded-full bg-gray-100 object-cover" />
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                            <Edit2 size={20} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <button className="text-sm font-bold text-blue-600 hover:underline mb-2">Change Avatar</button>
                                        <p className="text-xs text-gray-500">JPG, GIF or PNG. 1MB max.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">First Name</label>
                                            <input type="text" defaultValue={user?.name.split(' ')[0]} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none font-medium" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Last Name</label>
                                            <input type="text" defaultValue={user?.name.split(' ')[1] || ''} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none font-medium" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Email Address</label>
                                        <input type="email" defaultValue={user?.email} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none font-medium" />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100"></div>

                            <div>
                                <h3 className="font-bold text-lg mb-6">Password</h3>
                                <div className="space-y-4">
                                    <button className="flex items-center gap-2 text-kingdom-black font-bold border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
                                        <Lock size={16} /> Change Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="max-w-xl space-y-6 animate-fade-in">
                            <h3 className="font-bold text-lg mb-6">Notification Preferences</h3>
                            
                            {[
                                { title: 'Project Updates', desc: 'Get notified when a project status changes.' },
                                { title: 'New Comments', desc: 'Get notified when someone comments on your project.' },
                                { title: 'File Uploads', desc: 'Get notified when new assets are uploaded.' },
                                { title: 'Marketing Emails', desc: 'Receive news and updates from Kingdom Kanvas.' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                    </div>
                                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer bg-kingdom-black flex-shrink-0 ml-4">
                                        <span className="absolute left-0 inline-block w-6 h-6 bg-white border-2 border-kingdom-black rounded-full shadow transform translate-x-6 transition-transform"></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'billing' && (
                         <div className="max-w-xl space-y-8 animate-fade-in">
                            <div className="bg-kingdom-black text-white p-6 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-kingdom-yellow rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-gray-400 text-sm font-medium mb-1">Current Plan</p>
                                            <h3 className="text-3xl font-display font-bold">Pro Plan</h3>
                                        </div>
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">Active</span>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <p className="text-2xl font-bold">$49<span className="text-sm font-normal text-gray-400">/mo</span></p>
                                        <p className="text-sm text-gray-400">Next billing date: June 1, 2024</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-4">Payment Method</h3>
                                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">Visa ending in 4242</p>
                                        <p className="text-xs text-gray-500">Expires 12/25</p>
                                    </div>
                                    <button className="text-sm font-bold text-gray-500 hover:text-black">Edit</button>
                                </div>
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Modals ---

const NewProjectModal = ({ onClose, orgId, onProjectCreated }: { onClose: () => void, orgId: string, onProjectCreated?: (newProject: any) => void }) => {
    const [projectName, setProjectName] = useState("");
    const [projectType, setProjectType] = useState<string | null>(null);
    const [department, setDepartment] = useState("");
    const [referenceLink, setReferenceLink] = useState("");
    const [conceptDate, setConceptDate] = useState("");
    const [finalDate, setFinalDate] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateProject = async () => {
        if (!projectName || !projectType || !description) {
            alert("Please fill in all required fields (Project Name, Project Type, and Description)");
            return;
        }

        if (!orgId) {
            alert("No organization selected");
            return;
        }
        
        setIsLoading(true);
        
        try {
            const newProject = await createProject(orgId, {
                title: projectName,
                type: projectType as any,
                status: 'ready',
                createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                conceptDueDate: conceptDate || 'TBD',
                finalDueDate: finalDate || 'TBD',
                description: description,
                department: department,
                referenceLink: referenceLink
            });
            
            alert(`Project "${projectName}" created successfully!`);
            
            // Call the callback to update parent state instead of reloading
            if (onProjectCreated) {
                onProjectCreated(newProject);
            }
            
            onClose();
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
             <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                    <div>
                        <h2 className="font-display font-bold text-2xl">Start New Project</h2>
                        <p className="text-sm text-gray-500">Fill in the details to kick off a new request.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Section 1: Core Info */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Project Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder="e.g., Summer Series 2024"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none font-medium transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-3">Project Type <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                    { id: 'sermon-series', label: 'Sermon Series', icon: Layers },
                                    { id: 'event', label: 'Event', icon: CalendarDays },
                                    { id: 'branding', label: 'Branding', icon: Tag },
                                    { id: 'social-media', label: 'Social Media', icon: Smartphone },
                                    { id: 'print', label: 'Print', icon: Printer },
                                    { id: 'other', label: 'Other', icon: MoreHorizontal },
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setProjectType(type.id)}
                                        className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                                            projectType === type.id
                                            ? 'border-kingdom-black bg-gray-50 text-black shadow-md'
                                            : 'border-gray-200 hover:border-kingdom-black hover:bg-gray-50 hover:shadow-md text-gray-600 hover:text-black'
                                        }`}
                                    >
                                        <type.icon size={24} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold uppercase tracking-wide">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Section 2: Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Ministry / Department</label>
                            <div className="relative">
                                <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none appearance-none text-gray-600"
                                >
                                    <option value="">Select Department...</option>
                                    <option value="adult-ministries">Adult Ministries</option>
                                    <option value="youth">Youth (Students)</option>
                                    <option value="kids">Kids</option>
                                    <option value="worship-creative">Worship / Creative</option>
                                    <option value="outreach-missions">Outreach / Missions</option>
                                    <option value="operations">Operations</option>
                                </select>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Reference Link</label>
                            <div className="relative">
                                <LinkIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="url"
                                    placeholder="Pinterest, Are.na, etc."
                                    value={referenceLink}
                                    onChange={(e) => setReferenceLink(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Concept Due Date</label>
                            <input
                                type="date"
                                value={conceptDate}
                                onChange={(e) => setConceptDate(e.target.value)}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Final Due Date</label>
                            <input
                                type="date"
                                value={finalDate}
                                onChange={(e) => setFinalDate(e.target.value)}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none text-gray-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Brief / Description <span className="text-red-500">*</span></label>
                        <textarea
                            rows={4}
                            placeholder="Describe the vision, mood, and specific requirements for this project..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Attachments</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-kingdom-black hover:text-kingdom-black hover:bg-gray-50 transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-white border border-gray-100 group-hover:shadow-sm transition-all">
                                <Plus size={24} />
                            </div>
                            <span className="font-bold text-sm">Click to upload or drag and drop</span>
                            <span className="text-xs mt-1 text-gray-400">PDF, PNG, JPG (Max 10MB)</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0 z-20">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:text-black hover:bg-gray-200 transition-colors">Cancel</button>
                    <button
                        onClick={handleCreateProject}
                        className="px-6 py-3 rounded-xl font-bold bg-kingdom-black text-white hover:bg-neutral-800 transition-colors shadow-lg shadow-black/20"
                    >
                        Create Project
                    </button>
                </div>
             </div>
        </div>
    )
}

const AuthScreen = () => {
    const { signIn, isLoading } = useAuth();
    const [email, setEmail] = useState("");

    const handleEmailLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        signIn('email', email);
    };

    return (
        <div className="min-h-screen bg-kingdom-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl shadow-white/10 animate-fade-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-kingdom-black text-white rounded-xl flex items-center justify-center font-display font-bold text-2xl mb-4 shadow-lg">K</div>
                    <h1 className="font-display font-bold text-2xl text-center mb-1">Sign in to Kingdom Kanvas</h1>
                    <p className="text-gray-500 text-sm text-center">Welcome back! Please enter your details.</p>
                </div>

                <div className="space-y-3 mb-6">
                    <button 
                        onClick={() => signIn('google')}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                            <>
                                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path d="M12.0003 20.45c4.656 0 8.568-3.36 9.36-7.8h-9.36v-4.8h14.4c.144 1.152.24 2.376.24 3.6 0 8.016-5.832 13.8-14.64 13.8-8.28 0-15-6.72-15-15s6.72-15 15-15c3.84 0 7.344 1.32 10.08 3.48l-3.84 3.84c-1.392-1.2-3.648-2.52-6.24-2.52-5.496 0-9.96 4.608-9.96 10.2s4.464 10.2 9.96 10.2z" fill="currentColor"></path></svg>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>
                    <button 
                        onClick={() => signIn('github')}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <Github size={20} />
                        <span>Continue with GitHub</span>
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with email</span></div>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black outline-none font-medium transition-all"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-kingdom-black text-white p-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors shadow-lg shadow-black/20 disabled:opacity-70 flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Sign in with Email"}
                    </button>
                </form>

                <p className="mt-8 text-center text-xs text-gray-400">
                    Secured by Vercel. By clicking continue, you agree to our <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
};

const Sidebar = ({ 
    user, 
    activeView, 
    setView, 
    onLogout,
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen
}: { 
    user: User, 
    activeView: string, 
    setView: (v: string) => void,
    onLogout: () => void,
    collapsed: boolean,
    setCollapsed: (c: boolean) => void,
    mobileOpen: boolean,
    setMobileOpen: (o: boolean) => void
}) => {
    // If mobile menu is open, we force content to be visible (treat as not collapsed for content)
    // but the physical width transition handles the drawer.
    const showText = !collapsed || mobileOpen;
    
    // Helper to determine active class based on view
    const getLinkClass = (viewName: string) => {
        const isActive = activeView === viewName || (viewName === 'projects' && activeView === 'project-detail');
        const baseClass = "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative group/item";
        const colorClass = isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5';
        // Only center if collapsed AND NOT on mobile (mobile drawer is always wide)
        const alignment = (collapsed && !mobileOpen) ? 'justify-center' : '';
        
        return `${baseClass} ${colorClass} ${alignment}`;
    }

    const handleNavClick = (view: string) => {
        setView(view);
        setMobileOpen(false); // Close mobile menu on nav click
    }

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileOpen(false)}
                ></div>
            )}

            {/* Sidebar Content */}
            <div className={`
                fixed top-0 left-0 h-screen bg-kingdom-black text-white flex flex-col z-50 transition-all duration-300 ease-in-out shadow-2xl
                ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'} 
                md:translate-x-0 ${collapsed ? 'md:w-20' : 'md:w-72'}
            `}>
                
                {/* Collapse Toggle (Desktop Only) */}
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex absolute -right-3 top-10 w-6 h-6 bg-white text-kingdom-black rounded-full items-center justify-center border border-gray-200 shadow-sm hover:scale-110 transition-transform z-50"
                >
                    <ChevronLeft size={14} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile Close Button */}
                <button 
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden absolute right-4 top-4 p-2 text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>

                {/* Logo Area */}
                <div className={`p-8 pb-10 ${!showText ? 'px-4 flex justify-center' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-display font-bold text-xl flex-shrink-0">K</div>
                        <div className={`flex flex-col transition-opacity duration-300 ${!showText ? 'opacity-0 w-0 overflow-hidden absolute' : 'opacity-100'}`}>
                            <span className="font-display font-bold text-xl leading-none">Kingdom</span>
                            <span className="font-display font-normal text-lg leading-none opacity-80">Kanvas</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto overflow-x-hidden">
                    {user.role === 'designer' && (
                        <button 
                            onClick={() => handleNavClick('orgs')}
                            className={getLinkClass('orgs')}
                            title={!showText ? "Organizations" : ""}
                        >
                            <Building2 size={20} />
                            {showText && <span className="font-medium whitespace-nowrap">Organizations</span>}
                        </button>
                    )}
                    
                    <button 
                        onClick={() => handleNavClick('dashboard')}
                        className={getLinkClass('dashboard')}
                        title={!showText ? "Dashboard" : ""}
                    >
                        <Grid size={20} />
                        {showText && <span className="font-medium whitespace-nowrap">Dashboard</span>}
                    </button>

                    <button 
                        onClick={() => handleNavClick('projects')}
                        className={getLinkClass('projects')}
                        title={!showText ? "Projects" : ""}
                    >
                        <Folder size={20} />
                        {showText && <span className="font-medium whitespace-nowrap">Projects</span>}
                    </button>

                    <button 
                        onClick={() => handleNavClick('team')}
                        className={getLinkClass('team')}
                        title={!showText ? "Team" : ""}
                    >
                        <Users size={20} />
                        {showText && <span className="font-medium whitespace-nowrap">Team</span>}
                    </button>

                    <button 
                        onClick={() => handleNavClick('settings')}
                        className={getLinkClass('settings')}
                        title={!showText ? "Settings" : ""}
                    >
                        <Settings size={20} />
                        {showText && <span className="font-medium whitespace-nowrap">Settings</span>}
                    </button>
                </nav>

                {/* User Profile & Logout */}
                <div className={`p-6 border-t border-white/10 space-y-4 ${!showText ? 'px-2' : ''}`}>
                    <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-default transition-colors ${!showText ? 'justify-center p-2' : ''}`}>
                        <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full bg-kingdom-yellow object-cover flex-shrink-0" />
                        {showText && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-white">{user.name}</p>
                                <p className="text-xs text-gray-400 truncate capitalize">{user.role}</p>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={onLogout}
                        className={`w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-white transition-colors ${!showText ? 'text-[0px]' : ''}`}
                        title="Sign Out"
                    >
                        <LogOut size={14} />
                        {showText && "Sign Out"}
                    </button>
                </div>
            </div>
        </>
    );
};

const ProjectDetail = ({ project: initialProject, role, onBack }: { project: Project, role: Role, onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<'activity' | 'assets' | 'deliverables' | 'brief'>('brief');
    const [projectStatus, setProjectStatus] = useState<ProjectStatus>(initialProject.status);
    const [activity, setActivity] = useState<ActivityItem[]>(initialProject.activity || []);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        setActivity(initialProject.activity || []);
        setProjectStatus(initialProject.status);
    }, [initialProject.id]);

    const handleStatusChange = (newStatus: ProjectStatus) => {
        setProjectStatus(newStatus);
        const newActivity: ActivityItem = {
            id: Date.now().toString(),
            type: 'status',
            userId: 'currentUser',
            userName: role === 'designer' ? 'Senior Designer' : 'Pastor Dave',
            userAvatar: role === 'designer' ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=King' : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave',
            timestamp: 'Just now',
            content: `changed status to ${getStatusInfo(newStatus).label}`
        };
        setActivity([newActivity, ...activity]);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        const newActivity: ActivityItem = {
            id: Date.now().toString(),
            type: 'message',
            userId: 'currentUser',
            userName: role === 'designer' ? 'Senior Designer' : 'Pastor Dave',
            userAvatar: role === 'designer' ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=King' : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave',
            timestamp: 'Just now',
            content: newMessage
        };
        setActivity([newActivity, ...activity]);
        setNewMessage("");
    };

    const projectManagers = initialProject.team.filter(m => m.role === 'Project Manager');
    const creativeDirectors = initialProject.team.filter(m => m.role === 'Creative Director');
    const designers = initialProject.team.filter(m => m.role === 'Designer');
    const clients = initialProject.team.filter(m => m.role === 'Client');

    return (
        <div className="animate-slide-up h-full flex flex-col relative">

            {/* Header */}
            <div className="bg-white border-b border-kingdom-border p-4 md:p-8 pb-0">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition-colors group">
                    <div className="p-1 rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white transition-colors">
                        <ArrowLeft size={16} />
                    </div>
                    Back to Dashboard
                </button>
                
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{initialProject.type.replace('-', ' ')}</span>
                            <StatusSelect status={projectStatus} onChange={handleStatusChange} />
                        </div>
                        <h1 className="font-display font-bold text-3xl md:text-4xl">{initialProject.title}</h1>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-black transition-colors">
                            <Users size={18} />
                            <span>Share</span>
                        </button>
                        <button className="btn-primary flex-1 md:flex-none text-center justify-center">
                            Complete Review
                        </button>
                    </div>
                </div>

                {/* Project Timeline & Team */}
                <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 border-t border-dashed border-gray-200 py-8 mb-8">
                    {/* Timeline Group */}
                    <div className="flex-shrink-0 w-full xl:w-auto">
                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Timeline</h4>
                         <div className="grid grid-cols-3 gap-4 w-full">
                             <div className="flex flex-col gap-1">
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Started</span>
                                 <div className="flex items-center gap-2">
                                     <CalendarDays size={18} className="text-gray-400" />
                                     <p className="font-medium text-black text-sm sm:text-base">{formatDate(initialProject.createdAt)}</p>
                                 </div>
                             </div>
                             <div className="flex flex-col gap-1">
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">First Concept</span>
                                 <div className="flex items-center gap-2">
                                     <Clock size={18} className="text-yellow-600" />
                                     <p className="font-medium text-black text-sm sm:text-base">{formatDate(initialProject.conceptDueDate)}</p>
                                 </div>
                             </div>
                             <div className="flex flex-col gap-1">
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Final Delivery</span>
                                 <div className="flex items-center gap-2">
                                     <CheckCircle2 size={18} className="text-black" />
                                     <p className="font-medium text-black text-sm sm:text-base">{formatDate(initialProject.finalDueDate)}</p>
                                 </div>
                             </div>
                         </div>
                    </div>

                    <div className="hidden xl:block w-px bg-gray-200 self-stretch"></div>

                    <div className="w-full">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Project Team</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 xl:flex xl:flex-wrap xl:gap-8 items-start">
                            <TeamAvatarGroup title="Project Manager" members={projectManagers} />
                            <TeamAvatarGroup title="Creative Director" members={creativeDirectors} />
                            <TeamAvatarGroup title="Designers" members={designers} />
                            <TeamAvatarGroup title="Clients" members={clients} />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-200 md:border-0 pb-4 md:pb-0">
                    {[
                        { id: 'brief', label: 'Brief', icon: FileText },
                        { id: 'activity', label: 'Activity', icon: Activity },
                        { id: 'assets', label: 'Assets', icon: ImageIcon },
                        { id: 'deliverables', label: 'Deliverables', icon: Package },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center justify-center sm:justify-start gap-2 pb-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'border-kingdom-black text-black font-medium' 
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-8 bg-kingdom-gray overflow-y-auto relative">

                {activeTab === 'brief' && (
                    <div className="max-w-4xl h-full flex flex-col mr-auto">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <FileText size={20} className="text-gray-400" />
                                <h2 className="font-display font-bold text-2xl">Project Brief</h2>
                            </div>
                            
                            {initialProject.description ? (
                                <div className="prose max-w-none">
                                    <p className="text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                                        {initialProject.description}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No brief/description provided yet.</p>
                                </div>
                            )}

                            {initialProject.department && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Building2 size={16} className="text-gray-400" />
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Department</span>
                                        <span className="text-sm font-medium text-gray-700 capitalize">{initialProject.department}</span>
                                    </div>
                                </div>
                            )}

                            {initialProject.referenceLink && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <LinkIcon size={16} className="text-gray-400" />
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reference Link</span>
                                        <a
                                            href={initialProject.referenceLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-blue-600 hover:underline truncate"
                                        >
                                            {initialProject.referenceLink}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="max-w-4xl h-full flex flex-col mr-auto">
                        {/* Feed */}
                        <div className="flex-1 space-y-6 mb-24">
                           {activity && activity.length > 0 ? (
                               activity.map(item => (
                                   <div key={item.id} className="flex gap-4 animate-fade-in">
                                       <img src={item.userAvatar} className="w-10 h-10 rounded-full bg-gray-100 object-cover flex-shrink-0" />
                                       
                                       <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm">{item.userName}</span>
                                                <span className="text-xs text-gray-400">{item.timestamp}</span>
                                            </div>
                                            
                                            <div className={`p-4 rounded-2xl rounded-tl-none border ${item.type === 'message' ? 'bg-white border-gray-100 shadow-sm' : 'bg-transparent border-transparent pl-0 pt-2'}`}>
                                                 {item.type === 'message' && <p className="text-gray-800 text-sm leading-relaxed">{item.content}</p>}
                                                 
                                                 {item.type === 'upload' && (
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 text-gray-400 flex-shrink-0">
                                                            <FileIcon size={20}/>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-sm text-gray-900 break-all">{item.content}</p>
                                                            <p className="text-xs text-gray-500">New asset uploaded • {item.file?.size}</p>
                                                        </div>
                                                        <button className="text-sm font-bold text-blue-600 hover:underline">Download</button>
                                                    </div>
                                                 )}
            
                                                 {item.type === 'status' && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 italic">
                                                        <div className="w-2 h-2 rounded-full bg-kingdom-yellow"></div>
                                                        {item.content}
                                                    </div>
                                                 )}
                                            </div>
                                       </div>
                                   </div>
                               ))
                           ) : (
                               <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                   <MessageSquare size={48} className="mb-4 opacity-20" />
                                   <p>No activity yet. Start the conversation!</p>
                               </div>
                           )}
                        </div>
            
                        <div className="sticky bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-kingdom-gray via-kingdom-gray to-transparent">
                            <div className="max-w-4xl bg-white border border-gray-200 p-2 rounded-2xl flex gap-4 items-end shadow-xl shadow-black/5 mr-auto">
                                <div className="flex-1">
                                    <textarea 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Post an update..." 
                                        className="w-full resize-none border-0 focus:ring-0 p-3 text-sm max-h-32 bg-transparent placeholder:text-gray-400 outline-none"
                                        rows={1}
                                    />
                                    <div className="flex items-center gap-2 px-2 pb-2">
                                        <button className="p-2 text-gray-400 hover:text-black transition-colors rounded-lg hover:bg-gray-50" title="Attach File">
                                            <Paperclip size={18} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-black transition-colors rounded-lg hover:bg-gray-50" title="Upload Image">
                                            <ImageIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <button 
                                        onClick={handleSendMessage}
                                        className="bg-kingdom-black text-white p-3 rounded-xl hover:bg-neutral-800 transition-colors shadow-lg shadow-black/20 group"
                                    >
                                        <Send size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'assets' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden group relative cursor-pointer">
                                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-300">
                                    <ImageIcon size={48} />
                                </div>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button className="p-3 bg-white rounded-full hover:scale-110 transition-transform"><Download size={20} /></button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                                    <p className="font-medium text-sm truncate">Asset_Export_v{i}.jpg</p>
                                    <p className="text-xs text-gray-500">2.4 MB • JPG</p>
                                </div>
                            </div>
                        ))}
                         <div className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-600 cursor-pointer transition-colors">
                            <Plus size={32} />
                            <span className="font-medium text-sm mt-2 text-center">Upload Asset</span>
                         </div>
                    </div>
                )}
                
                {activeTab === 'deliverables' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="font-display font-bold text-2xl">Final Deliverables</h2>
                                <p className="text-gray-500">Official files ready for publication and print.</p>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button className="btn-accent flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm px-5 py-2.5">
                                    <Download size={18} /> Download All (.zip)
                                </button>
                                {role === 'designer' && (
                                     <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:border-black transition-colors font-medium text-sm">
                                        <Plus size={18} /> Upload New
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            {[
                                { name: "Series_Title_Slide_4K.jpg", size: "4.2 MB", date: "May 20, 2024", type: "IMAGE" },
                                { name: "Instagram_Square_Kit.zip", size: "128 MB", date: "May 20, 2024", type: "ZIP" },
                                { name: "Print_Bulletin_Insert_v2.pdf", size: "15.4 MB", date: "May 21, 2024", type: "PDF" },
                                { name: "ProPresenter_Bundle.probundle", size: "45 MB", date: "May 22, 2024", type: "FILE" },
                            ].map((file, i) => (
                                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors gap-4">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                                            {file.type === 'IMAGE' && <ImageIcon size={24} />}
                                            {file.type === 'ZIP' && <Package size={24} />}
                                            {file.type === 'PDF' && <FileText size={24} />}
                                            {file.type === 'FILE' && <FileIcon size={24} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">{file.size} • Uploaded {file.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                         {role === 'designer' && (
                                            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                                                <X size={18} />
                                            </button>
                                        )}
                                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium">
                                            <Download size={16} /> Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                             {role === 'designer' && (
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 w-full text-center hover:border-gray-400 hover:bg-gray-100 transition-all cursor-pointer">
                                        <Plus size={32} className="mx-auto text-gray-400 mb-2" />
                                        <p className="font-medium text-gray-600">Drag & Drop or Click to Upload Deliverables</p>
                                        <p className="text-xs text-gray-400 mt-1">Supports PDF, ZIP, JPG, PNG (Max 5GB)</p>
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard = ({
    role,
    orgs,
    setOrgs,
    view,
    selectOrg,
    selectProject,
    goBackToOrgs,
    user
}: {
    role: Role,
    orgs: Organization[],
    setOrgs: (orgs: Organization[]) => void,
    view: string,
    selectOrg: (id: string) => void,
    selectProject: (p: Project) => void,
    goBackToOrgs: () => void,
    user: User | null
}) => {
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
    const [onlyMyProjects, setOnlyMyProjects] = useState(false);

    if (role === 'designer' && view === 'orgs') {
        return (
            <div className="p-4 md:p-8 animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="font-display font-bold text-3xl mb-1">Organizations</h1>
                        <p className="text-gray-500">Manage your partner churches and ministries.</p>
                    </div>
                    <button className="btn-primary flex items-center gap-2 bg-kingdom-black text-white px-4 py-2 rounded-xl hover:bg-neutral-800 transition-colors">
                        <Plus size={18} /> <span className="hidden sm:inline">New Organization</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {orgs.map(org => (
                        <div 
                            key={org.id} 
                            onClick={() => selectOrg(org.id)}
                            className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-black/5 hover:border-kingdom-yellow/50 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                    <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${org.plan === 'pro' ? 'bg-kingdom-yellow text-black' : 'bg-gray-100 text-gray-500'}`}>
                                    {org.plan} Plan
                                </span>
                            </div>
                            
                            <h3 className="font-bold text-xl mb-1 group-hover:text-kingdom-yellow transition-colors">{org.name}</h3>
                            <p className="text-sm text-gray-500 mb-6">{org.projects.length} Active Projects</p>
                            
                            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                                    ))}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-kingdom-black group-hover:text-white transition-colors">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-kingdom-yellow hover:text-kingdom-yellow hover:bg-kingdom-yellow/5 transition-all">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-inherit">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold">Add Organization</span>
                    </button>
                </div>
            </div>
        );
    }

    let activeOrg: Organization | undefined;
    let projectsToDisplay: (Project & { orgName?: string; orgLogo?: string })[] = [];
    
    if (view.startsWith('org:')) {
        const orgId = view.split(':')[1];
        activeOrg = orgs.find(o => o.id === orgId);
        if (activeOrg) {
            projectsToDisplay = activeOrg.projects;
        }
    } else if (role === 'client' || view === 'dashboard') {
        activeOrg = orgs[0];
        if (activeOrg) {
            projectsToDisplay = activeOrg.projects;
        }
    } else if (view === 'projects') {
         projectsToDisplay = orgs.flatMap(o => o.projects.map(p => ({...p, orgName: o.name, orgLogo: o.logo})));
    }

    // Filter Logic
    const filteredProjects = projectsToDisplay.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        
        let matchesAssignment = true;
        if (onlyMyProjects && user) {
            matchesAssignment = p.team.some(member => member.email === user.email);
        }

        return matchesSearch && matchesStatus && matchesAssignment;
    });

    if (!activeOrg && view !== 'projects') return <div>Organization not found</div>;

    const filterTabs: { id: ProjectStatus | 'all', label: string }[] = [
        { id: 'all', label: 'All Projects' },
        { id: 'ready', label: 'Ready for Production' },
        { id: 'in-progress', label: 'In Production' },
        { id: 'on-hold', label: 'On Hold' },
        { id: 'review', label: 'In Review' },
        { id: 'completed', label: 'Complete' },
    ];

    return (
        <div className="p-4 md:p-8 animate-fade-in relative">
            {showNewProjectModal && activeOrg && (
                <NewProjectModal
                    onClose={() => setShowNewProjectModal(false)}
                    orgId={activeOrg.id}
                    onProjectCreated={(newProject) => {
                        // Update the orgs state to include the new project
                        const updatedOrgs = orgs.map(org => {
                            if (org.id === activeOrg.id) {
                                return {
                                    ...org,
                                    projects: [...org.projects, {
                                        id: newProject.id,
                                        title: newProject.title,
                                        type: newProject.type,
                                        status: newProject.status,
                                        createdAt: newProject.createdAt,
                                        conceptDueDate: newProject.conceptDueDate,
                                        finalDueDate: newProject.finalDueDate,
                                        description: newProject.description,
                                        department: newProject.department,
                                        referenceLink: newProject.referenceLink,
                                        thumbnail: newProject.thumbnail,
                                        team: newProject.team || [],
                                        activity: newProject.activity || []
                                    }]
                                };
                            }
                            return org;
                        });
                        setOrgs(updatedOrgs);
                    }}
                />
            )}

            {/* Org Header (only show if not in 'All Projects' view) */}
            {view !== 'projects' && activeOrg && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        {role === 'designer' && view.startsWith('org:') && (
                             <button onClick={goBackToOrgs} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                 <ArrowLeft size={24} />
                             </button>
                        )}
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex-shrink-0">
                            <img src={activeOrg.logo} alt={activeOrg.name} className="w-full h-full object-contain rounded-xl" />
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">{activeOrg.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Package size={16} /> {activeOrg.plan === 'pro' ? 'Pro Plan' : 'Standard Plan'}</span>
                                <span className="flex items-center gap-1"><Users size={16} /> 12 Members</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => setShowNewProjectModal(true)}
                            className="bg-kingdom-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg shadow-black/20 w-full md:w-auto"
                        >
                            <Plus size={18} /> New Project
                        </button>
                    </div>
                </div>
            )}
            
            {view === 'projects' && (
                <div className="mb-8">
                     <h1 className="font-display font-bold text-3xl mb-1">All Projects</h1>
                     <p className="text-gray-500">Overview of all ongoing work across organizations.</p>
                </div>
            )}

            {/* Filters & Search Bar */}
            <div className="mb-8 space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    
                    {/* Filter Tabs - WRAPPED */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        {filterTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                    statusFilter === tab.id 
                                    ? 'bg-kingdom-black text-white shadow-md' 
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                        
                        <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block"></div>

                        <button 
                            onClick={() => setOnlyMyProjects(!onlyMyProjects)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                                onlyMyProjects 
                                ? 'bg-kingdom-black text-white border-kingdom-black shadow-md' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <Users size={16} />
                            <span className="whitespace-nowrap">My Projects</span>
                            {onlyMyProjects && <CheckCircle2 size={14} className="text-white" />}
                        </button>
                    </div>

                     {/* Search Bar - Full width mobile, fixed width desktop */}
                    <div className="relative w-full lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by title..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kingdom-black focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="mb-8">
                {view !== 'projects' && <h2 className="font-display font-bold text-xl mb-6">Active Projects</h2>}
                
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-gray-400">
                            <Search size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">No projects found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                        <button 
                            onClick={() => {setSearchQuery(''); setStatusFilter('all'); setOnlyMyProjects(false);}}
                            className="mt-4 text-blue-600 font-bold hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(project => (
                            <div 
                                key={project.id}
                                onClick={() => selectProject(project)}
                                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-black/5 hover:border-gray-300 hover:-translate-y-1 transition-all cursor-pointer group h-full flex flex-col animate-fade-in"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${project.type === 'sermon-series' ? 'bg-purple-100 text-purple-600' : project.type === 'event' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {project.type === 'sermon-series' && <Layers size={20} />}
                                        {project.type === 'event' && <CalendarDays size={20} />}
                                        {project.type === 'branding' && <Tag size={20} />}
                                        {project.type === 'social-media' && <Smartphone size={20} />}
                                        {project.type === 'print' && <Printer size={20} />}
                                        {project.type === 'other' && <MoreHorizontal size={20} />}
                                    </div>
                                    <StatusBadge status={project.status} />
                                </div>
                                
                                <h3 className="font-display font-bold text-2xl mb-2 leading-tight transition-colors">{project.title}</h3>
                                {project.orgName && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={project.orgLogo} className="w-5 h-5 rounded-full border border-gray-100" />
                                        <span className="text-xs text-gray-500 font-medium">{project.orgName}</span>
                                    </div>
                                )}
                                <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1">{project.description}</p>
                                
                                <div className="pt-6 border-t border-gray-100 mt-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</div>
                                        <div className="text-xs font-bold text-gray-900">
                                            {project.status === 'completed' ? '100%' : project.status === 'review' ? '90%' : project.status === 'in-progress' ? '45%' : '10%'}
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${project.status === 'completed' ? 'bg-green-500' : project.status === 'on-hold' ? 'bg-red-400' : 'bg-kingdom-black'}`} 
                                            style={{ width: project.status === 'completed' ? '100%' : project.status === 'review' ? '90%' : project.status === 'in-progress' ? '45%' : '10%' }}
                                        ></div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {project.team.slice(0,4).map(m => (
                                                <img key={m.id} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100" />
                                            ))}
                                            {project.team.length > 4 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    +{project.team.length - 4}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                            <Clock size={12} /> {project.finalDueDate}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {view !== 'projects' && (
                            <div 
                                onClick={() => setShowNewProjectModal(true)}
                                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-kingdom-black hover:text-kingdom-black hover:bg-gray-50 transition-all cursor-pointer min-h-[300px]"
                            >
                                <Plus size={48} className="mb-4 opacity-50" />
                                <h3 className="font-bold text-lg">Start New Project</h3>
                                <p className="text-sm text-center mt-2 max-w-[200px]">Create a sermon series, event package, or branding request.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- App Root ---

const AppContent = () => {
    const { user, signOut } = useAuth();
    
    // View state
    const [view, setView] = useState<string>('dashboard');
    const [previousView, setPreviousView] = useState<string>('dashboard');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Sidebar State
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Database state
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch organizations from database
    useEffect(() => {
        const fetchOrgs = async () => {
            if (!user) return;
            
            try {
                setIsLoading(true);
                const dbOrgs = await getOrganizations();
                
                // Convert DB organizations to app format
                const convertedOrgs: Organization[] = dbOrgs.map(org => ({
                    id: org.id,
                    name: org.name,
                    logo: org.logo,
                    plan: org.plan,
                    projects: org.projects.map(p => ({
                        id: p.id,
                        title: p.title,
                        type: p.type as any,
                        status: p.status as any,
                        createdAt: p.createdAt,
                        conceptDueDate: p.conceptDueDate,
                        finalDueDate: p.finalDueDate,
                        description: p.description,
                        department: p.department,
                        referenceLink: p.referenceLink,
                        thumbnail: p.thumbnail,
                        team: p.team,
                        activity: p.activity
                    }))
                }));
                
                setOrgs(convertedOrgs);
            } catch (error) {
                console.error('Error fetching organizations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrgs();
    }, [user]);

    // Effect to set initial view based on role
    useEffect(() => {
        if (user) {
            if (user.role === 'designer') {
                setView('orgs');
                setPreviousView('orgs');
            } else {
                setView('dashboard');
                setPreviousView('dashboard');
            }
        }
    }, [user]);

    const handleSelectOrg = (orgId: string) => {
        setView(`org:${orgId}`);
    };

    const handleSelectProject = (project: Project) => {
        setPreviousView(view); // Store current view before navigating
        setSelectedProject(project);
        setView('project-detail');
    };

    const handleBackFromProject = () => {
        setSelectedProject(null);
        // Restore previous view if valid
        if (previousView && previousView !== 'project-detail') {
            setView(previousView);
        } else {
             // Fallback
             if (user?.role === 'designer') setView('orgs');
             else setView('dashboard');
        }
    };

    if (!user) {
        return <AuthScreen />;
    }

    return (
        <div className="min-h-screen bg-grid-paper font-sans text-kingdom-black flex flex-col md:flex-row">
            
            <Sidebar 
                user={user}
                activeView={view.split(':')[0]} 
                setView={(v) => {
                    setSelectedProject(null);
                    setView(v);
                }} 
                onLogout={signOut}
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                mobileOpen={mobileMenuOpen}
                setMobileOpen={setMobileMenuOpen}
            />
            
            <main className={`flex-1 relative min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} ml-0`}>
                {/* Header */}
                <header className="h-16 md:h-20 px-4 md:px-8 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            className="md:hidden p-2 text-gray-500 hover:text-black"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-gray-400 hover:text-black transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-kingdom-yellow rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                {view === 'project-detail' && selectedProject ? (
                    <ProjectDetail project={selectedProject} role={user.role} onBack={handleBackFromProject} />
                ) : view === 'team' ? (
                    <TeamPage />
                ) : view === 'settings' ? (
                    <SettingsPage />
                ) : (
                    <Dashboard
                        role={user.role}
                        orgs={orgs}
                        setOrgs={setOrgs}
                        view={view}
                        selectOrg={handleSelectOrg}
                        selectProject={handleSelectProject}
                        goBackToOrgs={() => setView('orgs')}
                        user={user}
                    />
                )}
            </main>
        </div>
    );
};

// Mock Auth Provider Wrapper
const MockAuthProvider = ({ children }: { children?: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Simulate Auth.js 'signIn'
    const signIn = async (provider: string, email?: string) => {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let newUser: User;
        
        if (provider === 'google') {
            // Default Google Mock User (Designer)
            newUser = {
                id: 'google-user-1',
                name: 'Alex Johnson',
                email: 'alex@kingdomkanvas.com',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
                role: 'designer'
            };
        } else if (provider === 'github') {
            // Default Github Mock User (Dev/Designer)
            newUser = {
                id: 'github-user-1',
                name: 'Mike Ross',
                email: 'mike@kingdomkanvas.com',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
                role: 'designer'
            };
        } else if (provider === 'email' && email) {
            // Logic to determine role based on email domain
            if (email.includes('kingdomkanvas')) {
                newUser = {
                    id: 'email-user-1',
                    name: email.split('@')[0],
                    email: email,
                    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                    role: 'designer'
                };
            } else {
                 newUser = {
                    id: 'email-user-2',
                    name: 'Partner User', // Default name
                    email: email,
                    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                    role: 'client'
                };
            }
        } else {
             // Fallback
             newUser = {
                id: 'fallback-user',
                name: 'Guest',
                email: 'guest@example.com',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
                role: 'client'
            };
        }

        setUser(newUser);
        setIsLoading(false);
    };

    const signOut = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setUser(null);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

const App = () => {
    return (
        <MockAuthProvider>
            <AppContent />
        </MockAuthProvider>
    );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);