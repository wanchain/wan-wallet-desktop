del /f /s /q build
del /f /s /q dist

rd /q /s build

xcopy  assets build\assets\ /s /e /q
xcopy  src\modals build\modals\ /s /e /q
xcopy  config\i18n\locales build\locales\ /s /e /q
xcopy  src\index.html build\ /q