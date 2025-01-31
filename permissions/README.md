# Cloud Permissions Searcher

A cross-platform cloud permissions search engine designed to search and explore permissions and roles across multiple cloud providers, including GCP, AWS, and Azure. This tool supports searching permissions and roles in various modes, including permission and role modes, regex searches, and more, to facilitate the management of cloud permissions.

## 📚 Index

- [Usage](#usage)
  - [Permissions and Roles Mode](#permissions-and-roles-mode)
  - [Regex Mode](#regex-mode)
  - [Common Role Mode (Only for Permissions)](#common-role-mode-only-for-permissions)
  - [Multi Regex Mode (Only for Role)](#multi-regex-mode-only-for-role)
- [Contributing](#contributing)
- [License](#license)

## 💻 Usage

### Permissions and Roles Mode

In this mode, you can search for specific permissions and view the associated roles across GCP, AWS, and Azure platforms. Simply enter the permission name or role into the search bar, and the tool will display the matching results.

### 🔍 Regex Mode

Regex Mode allows you to search permissions and roles using regular expressions. This enables you to search for more complex patterns across permissions and roles, making it easier to find specific configurations.

![image](https://github.com/user-attachments/assets/955a6eff-37be-4c57-bec3-42523306a992)

### ⚖️ Common Role Mode (Only for Permissions)

This mode is used to search for roles that are common to multiple permissions. Enter multiple permissions separated by commas (e.g., `permission1,permission2`), and the tool will display the roles that are associated with all listed permissions.

![image](https://github.com/user-attachments/assets/8d6c4837-aceb-4d83-908b-f7fd38a24e2d)

### 🔄 Multi Regex Mode (Only for Roles)

In Multi Regex Mode, you can perform two regex searches, and the tool will join the results. This allows for advanced role filtering based on multiple regex patterns.

## 🤝 Contributing

We welcome contributions! To contribute to the project, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Open a pull request with a description of your changes.

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
