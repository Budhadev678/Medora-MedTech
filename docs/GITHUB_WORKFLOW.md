# 🐙 MEDORA — 2-Developer GitHub Collaboration Guide

This step-by-step guide explains how to set up GitHub, push the MEDORA codebase, and collaborate seamlessly between the **Core Engineer** and the **UI/UX Designer** without code conflicts.

---

## 🚀 1. Initial Setup: Push MEDORA to GitHub (Your PC)

### Step 1: Install Git (If not installed yet)
1. Download & install Git for Windows: **[https://git-scm.com/download/win](https://git-scm.com/download/win)** (or use **GitHub Desktop**: [https://desktop.github.com](https://desktop.github.com)).
2. During installation, select default settings and ensure *"Git from the command line and also from 3rd-party software"* is checked.
3. Open a new terminal / PowerShell window.

### Step 2: Configure Your Git Identity (One-time)
Run these commands in your terminal:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Initialize & Commit the Project
Open terminal in your project folder (`c:\Users\Dell\Downloads\Medora-MedTech`) and run:
```bash
# 1. Initialize local repository
git init

# 2. Add all files (ignoring node_modules and .next automatically via .gitignore)
git add .

# 3. Create your first master commit
git commit -m "feat(init): MEDORA foundation, Phase 1 auth & complete /docs suite"
```

### Step 4: Create a Repository on GitHub & Push
1. Go to **[github.com/new](https://github.com/new)**.
2. Repository name: `Medora-MedTech`
3. Set as **Private** (or Public).
4. **Do NOT** check "Add a README file" or ".gitignore" (we already have them).
5. Click **"Create repository"**.
6. Copy the commands shown under *"…or push an existing repository from the command line"* and run them:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Medora-MedTech.git
git push -u origin main
```
*(GitHub will ask you to sign in once in your browser)*

---

## 👥 2. How Your Teammate Clones & Works on Their PC

### Step 1: Add Your Teammate as a Collaborator
1. On your GitHub repo page $\rightarrow$ Go to **Settings** $\rightarrow$ **Collaborators**.
2. Click **"Add people"** and enter your teammate's GitHub username/email.
3. Your teammate will receive an invitation email and should accept it.

### Step 2: Teammate Clones the Repository
On their computer, your teammate opens terminal and runs:
```bash
# Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/Medora-MedTech.git

# Enter the directory
cd Medora-MedTech

# Install project dependencies
npm install

# Start the dev server to preview screens
npm run dev
```

---

## 🌿 3. The Safe 2-Developer Branching Workflow

To prevent conflicts where you and your teammate overwrite each other's code, follow this rule:
* **`main` branch:** The stable, working production branch.
* **`feature/ui-enhancements` branch:** Where your teammate makes design changes.

### 🎨 Teammate's Daily Workflow (UI/UX Work):

#### 1. Create a New Branch for Design Work
Before making changes, your teammate runs:
```bash
git checkout -b feature/ui-enhancements
```

#### 2. Make Visual Changes & Check Locally
* Your teammate edits `app/globals.css`, `components/ui/*`, and dashboard page styling.
* They check `http://localhost:3000` (or `3001`) in real-time.
* Before saving/committing, they verify no type errors:
  ```bash
  npm run typecheck
  ```

#### 3. Save & Push Changes to GitHub
```bash
# Check what files were changed
git status

# Stage the modified files
git add .

# Commit with a clear message
git commit -m "style: enhance patient home and doctor clinical cards UI"

# Push the branch to GitHub
git push -u origin feature/ui-enhancements
```

---

## 🔀 4. Merging the UI Changes into `main`

1. Go to your GitHub repository in the browser.
2. You will see a button: **"Compare & pull request"**. Click it.
3. Title: `Enhance UI/UX across patient and doctor screens`
4. Click **"Create pull request"**.
5. You (or your teammate) can review the visual diff and click **"Merge pull request"** $\rightarrow$ **"Confirm merge"**.

---

## 🔄 5. How You Get the Updated UI Code on Your PC

Whenever your teammate merges UI changes into `main`, you can pull the fresh code to your laptop with one command:
```bash
# Switch to main branch
git checkout main

# Download and merge latest changes from GitHub
git pull origin main
```

---

## ⚡ Quick Command Cheat Sheet

| Action | Command |
| :--- | :--- |
| **Check current branch & changed files** | `git status` |
| **Download latest code from teammate** | `git pull origin main` |
| **Create a new feature/design branch** | `git checkout -b feature/branch-name` |
| **Save all changes** | `git add .` |
| **Commit with a message** | `git commit -m "description of changes"` |
| **Send changes to GitHub** | `git push origin branch-name` |
| **Switch back to main branch** | `git checkout main` |
