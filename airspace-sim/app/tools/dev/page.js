'use client'

import {Box, Card} from "@mui/material"
import MuiPaletteShowcase from "./MuiPaletteShowcase";
import ClassificationBar from "../../components/ClassificationBar";
import FloatingPanel from "../../components/panels/floating/FloatingPanel";

export default function Home() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100dvh',
            }}
        >
            <ClassificationBar/>
            <Box
                style={{
                    position: 'relative',
                    width: '100dvw',
                    flexGrow: 1,
                    overflow: 'hidden',
                    margin: 0,
                    padding: 0,
                }}
            >

                <Box
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        right: 40,
                        zIndex: 1,
                    }}
                >
                    <FloatingPanel/>
                </Box>

                <Box sx={{height: '100%', alignContent: 'center', }}>
                    <Card
                        sx={{width: '40%', height: '80%', borderRadius: '5%', padding: 5, justifySelf: 'center'}}
                    >
                        <Card
                            sx={{overflow: 'auto', height: '100%', borderRadius: '5%', scrollbarWidth: 'none'}}
                        >
                            <MuiPaletteShowcase/>
                        </Card>
                    </Card>
                </Box>

            </Box>
            <ClassificationBar/>
        </Box>
    )
}