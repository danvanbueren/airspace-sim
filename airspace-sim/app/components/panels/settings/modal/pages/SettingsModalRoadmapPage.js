import {Stack} from '@mui/material'
import MarkdownContent from '@/app/components/global/MarkdownContent'
import roadmapMarkdown from '@/app/content/settings-roadmap.md'
import SettingsModalRestoreAllDefaultsSection from '../SettingsModalRestoreAllDefaultsSection'

export default function SettingsModalRoadmapPage() {
    return (
        <Stack spacing={3}>
            <MarkdownContent source={roadmapMarkdown} />
            <SettingsModalRestoreAllDefaultsSection/>
        </Stack>
    )
}
