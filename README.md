# Qizz - Quiz & Form Application

A Microsoft Forms-inspired quiz and form creation platform built with React, Firebase, Zustand, and TanStack Router.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - Email/password authentication with Firebase
- ✅ **Form Creation** - Create forms with multiple question types
- ✅ **Question Types**:
  - Multiple Choice (single answer)
  - Checkbox (multiple answers)
  - Short Answer (text input)
- ✅ **Form Management** - Edit, delete, and manage form status (draft/published)
- ✅ **Quiz Taking** - Interactive quiz interface for users
- ✅ **Analytics Dashboard** - View responses with statistics:
  - Total responses
  - Average score
  - Pass rate
- ✅ **Score Calculation** - Automatic scoring based on correct answers

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Routing**: TanStack Router (file-based routing)
- **State Management**: Zustand
- **Backend**: Firebase (Authentication + Firestore)
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Qizz-App_Cursor
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase config to `src/config/firebase.ts`

4. Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

## 🏃 Running the Application

### Development Mode
```bash
pnpm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production
```bash
pnpm run build
```

### Preview Production Build
```bash
pnpm run preview
```

## 📖 Usage

### For Form Creators

1. **Register/Login** - Create an account or sign in
2. **Create a Form**:
   - Navigate to Dashboard
   - Click "Create New Form"
   - Add title and description
   - Add questions with options and correct answers
   - Set points for each question
   - Publish or save as draft
3. **Manage Forms**:
   - Edit existing forms
   - Delete forms
   - View responses and analytics

### For Quiz Takers

1. **Browse Forms** - View all published forms
2. **Take a Quiz**:
   - Select a form
   - Answer all questions
   - Submit your responses
3. **View Confirmation** - See success message after submission

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── auth/        # Authentication components
│   ├── common/      # Shared components (Button, Input, Card, Navbar)
│   ├── form/        # Form builder components
│   ├── quiz/        # Quiz taking components
│   └── responses/   # Response viewing components
├── routes/          # TanStack Router routes
├── stores/          # Zustand state management
├── types/           # TypeScript type definitions
├── config/          # Firebase configuration
└── utils/           # Utility functions
```

## 🔐 Security

Firestore security rules ensure:
- Only authenticated users can create forms
- Only form creators can edit/delete their forms
- Only published forms are publicly visible
- Only form creators can view responses to their forms
- Responses are immutable after submission

## 🎨 Design

The application features a clean, modern design inspired by Microsoft Forms:
- Purple color scheme
- Card-based layouts
- Responsive design
- Smooth transitions and animations
- Custom scrollbar styling

## 📝 Firebase Collections

### `forms` Collection
```typescript
{
  id: string
  title: string
  description: string
  createdBy: string  // User UID
  status: 'draft' | 'published'
  questions: Question[]
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `responses` Collection
```typescript
{
  id: string
  formId: string
  userId: string
  userName: string
  answers: Record<string, string | string[]>
  score: number
  submittedAt: Timestamp
}
```

## 🚧 Future Enhancements

- [ ] Drag & drop question reordering
- [ ] CSV/Excel export for responses
- [ ] Form templates
- [ ] Question bank
- [ ] Time limits for quizzes
- [ ] Rich text editor
- [ ] Image upload for questions
- [ ] Form sharing via link
- [ ] Email notifications

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, please open an issue in the repository.

---

Built with ❤️ using React, Firebase, and Tailwind CSS
