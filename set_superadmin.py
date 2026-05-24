
import sys
import os
from sqlalchemy.orm import Session

# Add root directory to path
sys.path.append(os.getcwd())

# Import from the new unified app.py
from app import SessionLocal, UserModel

def set_superadmin():
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.email == "landrytchonda@gmail.com").first()
        if user:
            user.role = "superadmin"
            db.commit()
            print(f"L'utilisateur {user.email} est maintenant superadmin.")
        else:
            print("Utilisateur non trouvé. Assurez-vous d'avoir créé le compte d'abord.")
    except Exception as e:
        print(f"Erreur : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    set_superadmin()
