import MarkdownContent from '@/app/components/global/MarkdownContent'
import roadmapMarkdown from '@/app/content/settings-roadmap'

export default function SettingsModalRoadmapPage() {
    return (
        <MarkdownContent source={roadmapMarkdown} />
    )
}
