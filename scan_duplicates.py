import os
from collections import defaultdict

# Dossiers à ignorer (standard dev)
IGNORE_DIRS = {'node_modules', '.expo', '.git', 'dist', 'build', '.vscode'}
# Extensions à surveiller
EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx'}

def find_duplicates(root_dir):
    file_map = defaultdict(list)
    
    for root, dirs, files in os.walk(root_dir):
        # Filtrer les dossiers à ignorer
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            name, ext = os.path.splitext(file)
            if ext in EXTENSIONS:
                full_path = os.path.join(root, file)
                file_map[file].append(full_path)
    
    # Affichage des résultats
    print("\n🔍 --- ANALYSE DES DOUBLONS --- 🔍\n")
    found = False
    for filename, paths in file_map.items():
        if len(paths) > 1:
            found = True
            print(f"⚠️  DOUBLON DÉTECTÉ : {filename}")
            for p in paths:
                print(f"   - {p}")
            print("-" * 30)
            
    if not found:
        print("✅ Aucun doublon détecté dans les fichiers sources. Ton projet est propre !")

if __name__ == "__main__":
    find_duplicates('.')