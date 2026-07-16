import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { ProjectDetail } from '@/components/projects/ProjectDetail'

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <Header title="Projekt részletek" />
      <div className="p-6">
        <ProjectDetail id={params.id} />
      </div>
    </AppLayout>
  )
}
