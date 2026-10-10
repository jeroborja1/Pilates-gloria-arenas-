#!/usr/bin/env bash
# Cuenta los TODO que quedan en el sitio. Termina con error (código 1) si hay alguno.
# Uso antes de publicar: ./check-todos.sh   (no está conectado a nada automático)
cd "$(dirname "$0")" || exit 2

# Archivos del sitio (se excluyen copias de seguridad, originales y este script)
files=$(find . -maxdepth 1 -type f \( -name '*.html' -o -name '*.xml' -o -name '*.txt' \) | sort)

total=0
for f in $files; do
  n=$(grep -o 'TODO' "$f" | wc -l | tr -d ' ')
  if [ "$n" -gt 0 ]; then
    printf '%4s  %s\n' "$n" "${f#./}"
    total=$((total + n))
  fi
done

echo "-----"
echo "TODO restantes: $total"
if [ "$total" -gt 0 ]; then
  echo "Hay pendientes. Revisa PENDIENTES.md antes de publicar."
  exit 1
fi
echo "Sin TODO. Listo para publicar."
