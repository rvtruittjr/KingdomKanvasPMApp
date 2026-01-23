import { neon } from '@neondatabase/serverless';

// Create Neon client
let db: ReturnType<typeof neon> | null = null;

try {
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (connectionString) {
        db = neon(connectionString);
    } else {
        console.log('No database connection string found');
    }
} catch (error) {
    console.error('Failed to create Neon client:', error);
    db = null;
}

// Helper function to execute SQL queries
async function sql(strings: TemplateStringsArray, ...values: any[]) {
    if (!db) {
        throw new Error('Database connection not available');
    }
    const query = strings[0];
    const result = await db(query, ...values);
    return result;
}

// Project interface
export interface Project {
    id: string;
    title: string;
    type: 'sermon-series' | 'event' | 'branding' | 'social-media' | 'print' | 'other';
    status: 'ready' | 'in-progress' | 'on-hold' | 'review' | 'completed';
    createdAt: string;
    conceptDueDate: string;
    finalDueDate: string;
    description: string;
    department?: string;
    referenceLink?: string;
    thumbnail?: string;
    team: TeamMember[];
    activity: ActivityItem[];
}

export interface TeamMember {
    id: string;
    name: string;
    role: 'Project Manager' | 'Creative Director' | 'Designer' | 'Client';
    avatar: string;
    email: string;
    status: 'active' | 'invited';
}

export interface ActivityItem {
    id: string;
    type: 'message' | 'upload' | 'status';
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

export interface Organization {
    id: string;
    name: string;
    logo: string;
    plan: 'standard' | 'pro';
    projects: Project[];
}

// Initialize database tables
export async function initializeDatabase() {
    if (!db) {
        console.log('Database connection not available, skipping initialization');
        return;
    }

    try {
        // Create organizations table if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                logo TEXT,
                plan TEXT DEFAULT 'standard'
            );
        `;

        // Create projects table if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                concept_due_date TEXT NOT NULL,
                final_due_date TEXT NOT NULL,
                description TEXT NOT NULL,
                department TEXT,
                reference_link TEXT,
                thumbnail TEXT,
                team JSONB,
                activity JSONB,
                FOREIGN KEY (organization_id) REFERENCES organizations (id)
            );
        `;

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Mock data for when database connection fails
const MOCK_TEAMS: TeamMember[] = [
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
                team: MOCK_TEAMS,
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
                team: [MOCK_TEAMS[0], MOCK_TEAMS[2], MOCK_TEAMS[4]],
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
                team: [MOCK_TEAMS[1], { ...MOCK_TEAMS[4], name: 'Josh Miller' }],
                activity: []
            }
        ]
    }
];

// Get all organizations with their projects
export async function getOrganizations(): Promise<Organization[]> {
    if (!db) {
        console.log('Database connection not available, returning mock data');
        return MOCK_ORGS;
    }

    try {
        const orgsResult = await sql`
            SELECT * FROM organizations ORDER BY name;
        `;

        const organizations: Organization[] = [];
        const orgs = Array.isArray(orgsResult) ? orgsResult : [];

        for (const org of orgs) {
            const projectsResult = await sql`
                SELECT * FROM projects
                WHERE organization_id = ${org.id}
                ORDER BY created_at DESC;
            `;

            const projects = Array.isArray(projectsResult) ? projectsResult : [];

            organizations.push({
                id: org.id,
                name: org.name,
                logo: org.logo,
                plan: org.plan,
                projects: projects.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    type: p.type,
                    status: p.status,
                    createdAt: p.created_at,
                    conceptDueDate: p.concept_due_date,
                    finalDueDate: p.final_due_date,
                    description: p.description,
                    department: p.department,
                    referenceLink: p.reference_link,
                    thumbnail: p.thumbnail,
                    team: p.team ? JSON.parse(p.team) : [],
                    activity: p.activity ? JSON.parse(p.activity) : []
                }))
            });
        }

        return organizations;
    } catch (error) {
        console.error('Error fetching organizations:', error);
        console.log('Returning mock data as fallback');
        return MOCK_ORGS;
    }
}

// Create a new project
export async function createProject(
    organizationId: string,
    projectData: Omit<Project, 'id' | 'team' | 'activity'>
): Promise<Project> {
    if (!db) {
        console.log('Database connection not available, returning mock project');
        const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            ...projectData,
            id: projectId,
            team: [],
            activity: []
        };
    }

    try {
        const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newProject: Project = {
            ...projectData,
            id: projectId,
            team: [],
            activity: []
        };

        await sql`
            INSERT INTO projects (
                id, organization_id, title, type, status,
                created_at, concept_due_date, final_due_date,
                description, department, reference_link, team, activity
            ) VALUES (
                ${projectId}, ${organizationId}, ${newProject.title},
                ${newProject.type}, ${newProject.status},
                ${newProject.createdAt}, ${newProject.conceptDueDate},
                ${newProject.finalDueDate}, ${newProject.description},
                ${newProject.department}, ${newProject.referenceLink},
                ${JSON.stringify(newProject.team)}, ${JSON.stringify(newProject.activity)}
            );
        `;

        return newProject;
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
}

// Update project status
export async function updateProjectStatus(
    projectId: string,
    newStatus: string
): Promise<void> {
    if (!db) {
        console.log('Database connection not available, skipping status update');
        return;
    }

    try {
        await sql`
            UPDATE projects
            SET status = ${newStatus}
            WHERE id = ${projectId};
        `;
    } catch (error) {
        console.error('Error updating project status:', error);
        throw error;
    }
}

// Add activity to project
export async function addProjectActivity(
    projectId: string,
    activity: ActivityItem
): Promise<void> {
    if (!db) {
        console.log('Database connection not available, skipping activity update');
        return;
    }

    try {
        // Get current activities
        const projectResult = await sql`
            SELECT activity FROM projects WHERE id = ${projectId};
        `;

        const project = Array.isArray(projectResult) ? projectResult[0] : projectResult;
        const currentActivities = project && (project as any).activity ? JSON.parse((project as any).activity) : [];
        const updatedActivities = [activity, ...currentActivities];

        await sql`
            UPDATE projects
            SET activity = ${JSON.stringify(updatedActivities)}
            WHERE id = ${projectId};
        `;
    } catch (error) {
        console.error('Error adding activity:', error);
        throw error;
    }
}

// Create a new organization
export async function createOrganization(
    name: string,
    logo: string,
    plan: 'standard' | 'pro' = 'standard'
): Promise<Organization> {
    if (!db) {
        console.log('Database connection not available, returning mock organization');
        const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            id: orgId,
            name,
            logo,
            plan,
            projects: []
        };
    }

    try {
        const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await sql`
            INSERT INTO organizations (id, name, logo, plan) 
            VALUES (${orgId}, ${name}, ${logo}, ${plan});
        `;

        return {
            id: orgId,
            name,
            logo,
            plan,
            projects: []
        };
    } catch (error) {
        console.error('Error creating organization:', error);
        throw error;
    }
}
