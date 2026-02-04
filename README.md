# Crime Reporting System – Backend

## Required Tools

Make sure the following tools are installed before setup:
- PHP ≥ 8.1
- Composer (latest)
- MySQL
- Git
- Node.js (LTS) – for Vite
- VS Code 
- XAMPP / WAMP (for Windows users)
---
## Setup Development Environment

Follow these steps to run the project locally.

---
### Clone the Repository

```bash
git clone https://github.com/your-username/CrimeReportingSystem.git
cd CrimeReportingSystem/backend
```
### Install PHP Dependencies
Run the following command to install all necessary packages. This will create the `vendor/` directory.
```bash
composer install
```
### Create Environment File
```bash
copy .env.example .env
```
### Generate Application Key
```bash
php artisan key:generate
```
### Run the Application
```bash
php artisan serve
```
### How to Contribute?

3.  **Fork the Repo:** Click the "Fork" button on the top right.
4.  **Create a Branch:**
    ```bash
    git checkout -b feature-name
    ```
5.  **Make Changes & Commit:**
      * Keep code clean and commented.
    <!-- end list -->
    ```bash
    git commit -m "Fixed bug in login page"
    ```
6.  **Push Changes:**
    ```bash
    git push origin feature-name
    ```
7.  **Create a Pull Request (PR):** Go to the original repository and click "Compare & pull request".
