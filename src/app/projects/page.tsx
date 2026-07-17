import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { ProjectList } from '@/components/projects/ProjectList'

export default function ProjectsPage() {
  return (
    <AppLayout>
      <Header title="Projektek" />
      <div className="p-4 md:p-6">
        <ProjectList />
      </div>
    </AppLayout>
  )
}
