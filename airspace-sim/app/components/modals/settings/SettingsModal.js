import {Box, Modal, Typography} from "@mui/material";

export default function SettingsModal({open, onClose, state='settings'}) {

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 4,
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <Box sx={modalStyle}>
                <Typography>
                    {state}
                </Typography>
            </Box>
        </Modal>
    )
}