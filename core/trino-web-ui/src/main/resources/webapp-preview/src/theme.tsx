import { createTheme } from '@mui/material/styles'

const sharedTypography = {
    fontSize: 16,
}

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0b1367',
        },
        secondary: {
            main: '#f50057',
        },
    },
    typography: sharedTypography,
    components: {
        MuiLink: {
            styleOverrides: {
                root: {
                    color: '#f50057',
                    textDecoration: 'none',
                },
            },
        },
    },
})

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
    typography: sharedTypography,
    components: {
        MuiLink: {
            styleOverrides: {
                root: {
                    color: '#dd33fa',
                    textDecoration: 'none',
                },
            },
        },
    },
})
