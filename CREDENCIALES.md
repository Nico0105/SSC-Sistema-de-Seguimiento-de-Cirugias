# Credenciales de prueba — MediQ's

Usuarios que crea `npm run seed` (en `backend/`), uno por rol, para probar qué puede
hacer cada uno. **Son sólo para desarrollo y demo:** en un entorno real hay que
cambiar las contraseñas o no correr el seed.

| Rol | Email | Contraseña | Qué puede hacer |
|-----|-------|-----------|-----------------|
| Administrador | `admin@mediqus.local` | `Admin123!` | Todo: usuarios y roles, pacientes, turnos, cirugías, estados, quirófanos, checklist, insumos, emails |
| Jefe de quirófano | `jefe@mediqus.local` | `Jefe123!` | Pacientes, turnos, cirugías y su estado, quirófanos, configurar el checklist, seguimiento postoperatorio, insumos, auditoría de emails. No gestiona usuarios |
| Médico | `medico@mediqus.local` | `Medico123!` | Consulta todo el panel e historiales clínicos, marca el checklist, carga controles postoperatorios y consumo de insumos, y le deja mensajes a cada paciente desde su Historia (le llegan por email). No da de alta pacientes, turnos ni cirugías, ni cambia estados |
| Enfermero | `enfermero@mediqus.local` | `Enfermero123!` | Cambia el estado de las cirugías, marca el checklist, carga controles postoperatorios, gestiona insumos y su consumo. No da de alta pacientes, turnos ni cirugías |
| Recepcionista | `recepcion@mediqus.local` | `Recepcion123!` | Alta y edición de pacientes; consulta turnos y el estado de las cirugías. No ve historia clínica, no cambia estados ni gestiona usuarios |
| Administrativo | `administrativo@mediqus.local` | `Administrativo123!` | Pacientes, turnos y programación de cirugías, quirófanos, auditoría de emails; consulta información clínica e insumos. No cambia estados |
| Paciente | `paciente@mediqus.local` | `Paciente123!` | Sólo su portal: sus datos, sus cirugías, su checklist (lectura), sus indicaciones y evolución, los mensajes de su médico, y registrar síntomas. Vinculado al paciente de prueba Juan Pérez (DNI 30111222), que tiene una cirugía programada (código `MQ-001`) |

**Familiares:** no tienen cuenta. Siguen la cirugía en la pantalla pública
`http://localhost:3000/board` (o en la app móvil sin iniciar sesión) con el código
público que se les entrega, por ejemplo `MQ-001`. Esa pantalla nunca muestra datos
del paciente.

La matriz completa de permisos está en `backend/src/middleware/auth.ts`
(`PERMISSIONS`) y su espejo para la interfaz en `frontend/src/lib/permissions.ts`.
