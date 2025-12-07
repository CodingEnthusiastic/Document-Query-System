from models.project import ResearchProject
from models.user import User
from typing import List, Optional

class ProjectService:
    """Service class for project-related operations"""
    
    async def get_user_projects(self, user_id: str) -> List[ResearchProject]:
        """Get all projects for a specific user"""
        projects = await ResearchProject.find(ResearchProject.owner_id == user_id).to_list()
        return projects
    
    async def create_project(self, name: str, description: Optional[str], owner_id: str, created_by: str, tags: Optional[List[str]] = None) -> ResearchProject:
        """Create a new research project"""
        project = ResearchProject(
            name=name,
            description=description,
            tags=tags or [],
            owner_id=owner_id,
            created_by=created_by
        )
        await project.insert()
        return project
    
    async def get_project_by_id(self, project_id: str) -> Optional[ResearchProject]:
        """Get a project by its ID"""
        project = await ResearchProject.get(project_id)
        return project