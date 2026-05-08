export default function MuiPaletteShowcase() {
    const paletteGroups = [
        {
            title: 'Semantic Colors',
            dynamic: true,
            items: [
                'primary.main',
                'primary.light',
                'primary.dark',
                'primary.contrastText',
                'secondary.main',
                'secondary.light',
                'secondary.dark',
                'secondary.contrastText',
                'error.main',
                'warning.main',
                'info.main',
                'success.main',
            ],
        },
        {
            title: 'Text Colors',
            dynamic: true,
            items: [
                'text.primary',
                'text.secondary',
                'text.disabled',
            ],
        },
        {
            title: 'Background Colors',
            dynamic: true,
            items: [
                'background.default',
                'background.paper',
            ],
        },
        {
            title: 'Divider & Action',
            dynamic: true,
            items: [
                'divider',
                'action.active',
                'action.hover',
                'action.selected',
                'action.disabled',
                'action.disabledBackground',
                'action.focus',
            ],
        },
        {
            title: 'Common Colors',
            dynamic: false,
            items: [
                'common.white',
                'common.black',
            ],
        },
        {
            title: 'Grey Scale',
            dynamic: false,
            items: [
                'grey.50',
                'grey.100',
                'grey.200',
                'grey.300',
                'grey.400',
                'grey.500',
                'grey.600',
                'grey.700',
                'grey.800',
                'grey.900',
                'grey.A100',
                'grey.A200',
                'grey.A400',
                'grey.A700',
            ],
        },
    ]

    const materialFamilies = [
        'red',
        'pink',
        'purple',
        'deepPurple',
        'indigo',
        'blue',
        'lightBlue',
        'cyan',
        'teal',
        'green',
        'lightGreen',
        'lime',
        'yellow',
        'amber',
        'orange',
        'deepOrange',
        'brown',
        'grey',
        'blueGrey',
    ]

    const copySx = async (path) => {
        const sx = `sx={{ color: '${path}' }}`
        await navigator.clipboard.writeText(sx)
    }

    const copyBg = async (path) => {
        const sx = `sx={{ backgroundColor: '${path}' }}`
        await navigator.clipboard.writeText(sx)
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="space-y-3">
                    <h1 className="text-5xl font-bold tracking-tight">
                        Material UI Theme Palette Showcase
                    </h1>

                    <p className="text-lg text-neutral-400 max-w-4xl">
                        Interactive drag-and-drop reference for every major Material UI
                        palette token. Includes semantic colors, utility channels,
                        greyscale ramps, and Material Design color families.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paletteGroups.map((group) => (
                        <div
                            key={group.title}
                            draggable
                            className="rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between border-b border-neutral-800 p-5">
                                <div>
                                    <h2 className="text-2xl font-semibold">{group.title}</h2>
                                </div>

                                <div>
                                    {group.dynamic ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Dynamic
                    </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Static
                    </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {group.items.map((path) => (
                                    <div
                                        key={path}
                                        className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-4"
                                    >
                                        <div className="flex flex-wrap items-center gap-3 justify-between">
                                            <div>
                                                <div className="font-mono text-sm text-cyan-300">
                                                    theme.palette.{path}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => copySx(path)}
                                                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition text-sm font-medium"
                                                >
                                                    Copy Text SX
                                                </button>

                                                <button
                                                    onClick={() => copyBg(path)}
                                                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition text-sm font-medium"
                                                >
                                                    Copy BG SX
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            <div className="rounded-2xl border border-neutral-800 overflow-hidden">
                                                <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 text-xs text-neutral-400 uppercase tracking-wide">
                                                    Text Example
                                                </div>

                                                <div className="p-5 bg-neutral-950">
                                                    <div
                                                        style={{ color: `var(--mui-palette-${path.replace('.', '-')})` }}
                                                        className="text-2xl font-bold"
                                                    >
                                                        The quick brown fox jumps over the lazy dog.
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-neutral-800 overflow-hidden">
                                                <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 text-xs text-neutral-400 uppercase tracking-wide">
                                                    Background Example
                                                </div>

                                                <div
                                                    style={{
                                                        background: `var(--mui-palette-${path.replace('.', '-')})`,
                                                    }}
                                                    className="p-5 min-h-[110px] flex items-center justify-center"
                                                >
                                                    <div className="rounded-xl bg-black/40 px-4 py-2 backdrop-blur-sm text-sm font-semibold">
                                                        theme.palette.{path}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl overflow-hidden border border-neutral-800">
                                            <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 text-xs text-neutral-400 uppercase tracking-wide">
                                                SX Snippet
                                            </div>

                                            <pre className="p-4 overflow-auto text-sm text-green-300 bg-black font-mono">
{`sx={{
  color: '${path}',
  backgroundColor: '${path}',
  borderColor: '${path}',
}}`}
                      </pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
                    <div className="border-b border-neutral-800 p-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold">
                                Material Color Families
                            </h2>
                            <p className="text-neutral-400 mt-2">
                                Full Material Design color objects from @mui/material/colors
                            </p>
                        </div>

                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Static
            </span>
                    </div>

                    <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {materialFamilies.map((family) => (
                            <div
                                key={family}
                                draggable
                                className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-4"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="font-semibold text-lg">{family}</div>

                                    <button
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                `import { ${family} } from '@mui/material/colors'`
                                            )
                                        }
                                        className="text-xs px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
                                    >
                                        Copy Import
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {[
                                        '50',
                                        '100',
                                        '200',
                                        '300',
                                        '400',
                                        '500',
                                        '600',
                                        '700',
                                        '800',
                                        '900',
                                        'A100',
                                        'A200',
                                        'A400',
                                        'A700',
                                    ].map((shade) => (
                                        <div
                                            key={shade}
                                            className="rounded-xl border border-neutral-800 overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800">
                                                <div className="font-mono text-xs text-neutral-300">
                                                    {family}.{shade}
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        navigator.clipboard.writeText(
                                                            `sx={{ color: ${family}[${JSON.stringify(shade)}] }}`
                                                        )
                                                    }
                                                    className="text-xs px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 transition"
                                                >
                                                    Copy
                                                </button>
                                            </div>

                                            <div className="p-4 bg-black text-sm text-neutral-300 font-mono">
                                                {`
                                                import { ${family} } from '@mui/material/colors' 
                                                import {Box} from "@mui/material" 
                                                
                                                <Box
                                                  sx={{
                                                    color: ${family}[${JSON.stringify(shade)}],
                                                  }}
                                                />`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
                    <h2 className="text-3xl font-bold mb-4">
                        Example Theme Usage
                    </h2>

                    <div className="rounded-2xl overflow-hidden border border-neutral-800">
                        <div className="bg-neutral-950 p-6 overflow-auto text-green-300 font-mono text-sm">
                            {`import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',

    primary: {
      main: '#2196f3',
    },

    secondary: {
      main: '#f50057',
    },

    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
})

export default theme`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
