import { createClient } from '@vercel/postgres';

// Create Vercel Postgres client
const db = createClient();

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
    try {
        // Create organizations table if it doesn't exist
        await db.sql`
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                logo TEXT,
                plan TEXT DEFAULT 'standard'
            );
        `;

        // Create projects table if it doesn't exist
        await db.sql`
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

// Get all organizations with their projects
export async function getOrganizations(): Promise<Organization[]> {
    try {
        const { rows: orgs } = await db.sql`
            SELECT * FROM organizations ORDER BY name;
        `;

        const organizations: Organization[] = [];

        for (const org of orgs) {
            const { rows: projects } = await db.sql`
                SELECT * FROM projects
                WHERE organization_id = ${org.id}
                ORDER BY created_at DESC;
            `;

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
                    thumbnail: p.thumbnail,
                    team: p.team ? JSON.parse(p.team) : [],
                    activity: p.activity ? JSON.parse(p.activity) : []
                }))
            });
        }

        return organizations;
    } catch (error) {
        console.error('Error fetching organizations:', error);
        return [];
    }
}

// Create a new project
export async function createProject(
    organizationId: string,
    projectData: Omit<Project, 'id' | 'team' | 'activity'>
): Promise<Project> {
    try {
        const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newProject: Project = {
            ...projectData,
            id: projectId,
            team: [],
            activity: []
        };

        await db.sql`
            INSERT INTO projects (
                id, organization_id, title, type, status, 
                created_at, concept_due_date, final_due_date, 
                description, team, activity
            ) VALUES (
                ${projectId}, ${organizationId}, ${newProject.title}, 
                ${newProject.type}, ${newProject.status}, 
                ${newProject.createdAt}, ${newProject.conceptDueDate}, 
                ${newProject.finalDueDate}, ${newProject.description}, 
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
    try {
        await db.sql`
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
    try {
        // Get current activities
        const { rows: [project] } = await db.sql`
            SELECT activity FROM projects WHERE id = ${projectId};
        `;

        const currentActivities = project.activity ? JSON.parse(project.activity) : [];
        const updatedActivities = [activity, ...currentActivities];

        await db.sql`
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
    try {
        const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await db.sql`
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
