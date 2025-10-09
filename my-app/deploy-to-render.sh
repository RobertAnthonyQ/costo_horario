#!/bin/bash

# 🚀 Script de Deploy para Render
# Este script automatiza la preparación del código para Render

echo "🚀 Preparando código para deploy en Render..."

# Colores para el output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar que estamos en la rama correcta
echo -e "${YELLOW}📋 Verificando rama...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
  echo -e "${RED}⚠️  No estás en la rama 'dev'. Cambiando...${NC}"
  git checkout dev
fi

# 2. Verificar cambios pendientes
echo -e "${YELLOW}📋 Verificando cambios...${NC}"
if [[ -n $(git status -s) ]]; then
  echo -e "${YELLOW}⚠️  Tienes cambios sin commitear.${NC}"
  read -p "¿Deseas hacer commit? (y/n): " CONFIRM
  if [ "$CONFIRM" = "y" ]; then
    git add .
    read -p "Mensaje del commit: " COMMIT_MSG
    git commit -m "$COMMIT_MSG"
  fi
fi

# 3. Actualizar repositorio remoto
echo -e "${YELLOW}📤 Subiendo código a GitHub...${NC}"
git push origin dev

# 4. Verificar archivos necesarios
echo -e "${YELLOW}📋 Verificando archivos de configuración...${NC}"

FILES=("render.yaml" ".env.example" "DEPLOYMENT_RENDER_GUIDE.md")
ALL_PRESENT=true

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $file encontrado${NC}"
  else
    echo -e "${RED}❌ $file NO encontrado${NC}"
    ALL_PRESENT=false
  fi
done

# 5. Mostrar siguiente paso
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ CÓDIGO PREPARADO PARA RENDER${NC}"
echo -e "${GREEN}========================================${NC}\n"

if [ "$ALL_PRESENT" = true ]; then
  echo -e "${GREEN}Todos los archivos necesarios están listos.${NC}\n"
  echo -e "${YELLOW}📖 SIGUIENTE PASO:${NC}"
  echo -e "1. Ve a: ${GREEN}https://render.com${NC}"
  echo -e "2. Crea una cuenta o inicia sesión"
  echo -e "3. Sigue la guía en: ${GREEN}DEPLOYMENT_RENDER_GUIDE.md${NC}\n"
  echo -e "${YELLOW}📋 URLs que necesitarás:${NC}"
  echo -e "   Repositorio: ${GREEN}https://github.com/RobertAnthonyQ/costo_horario${NC}"
  echo -e "   Rama: ${GREEN}dev${NC}\n"
else
  echo -e "${RED}⚠️  Faltan algunos archivos. Revisa la configuración.${NC}\n"
fi

echo -e "${GREEN}🎉 ¡Listo para desplegar!${NC}\n"
