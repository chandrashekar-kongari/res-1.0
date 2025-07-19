import { Node } from "@tiptap/core";

export const SkillsSection = Node.create({
  name: "skillsSection",
  group: "block",
  content: "block+",
  parseHTML() {
    return [{ tag: 'section[data-type="skills"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["section", { ...HTMLAttributes, "data-type": "skills" }, 0];
  },
});

export const ExperienceSection = Node.create({
  name: "experienceSection",
  group: "block",
  content: "block+",
  parseHTML() {
    return [{ tag: 'section[data-type="experience"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["section", { ...HTMLAttributes, "data-type": "experience" }, 0];
  },
});

export const EducationSection = Node.create({
  name: "educationSection",
  group: "block",
  content: "block+",
  parseHTML() {
    return [{ tag: 'section[data-type="education"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["section", { ...HTMLAttributes, "data-type": "education" }, 0];
  },
});

export const ProjectsSection = Node.create({
  name: "projectsSection",
  group: "block",
  content: "block+",
  parseHTML() {
    return [{ tag: 'section[data-type="projects"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["section", { ...HTMLAttributes, "data-type": "projects" }, 0];
  },
});
