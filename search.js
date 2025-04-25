import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to search for a string in a file
function searchInFile(filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchString)) {
      console.log(`Found "${searchString}" in ${filePath}`);
      
      // Print the lines containing the search string with line numbers
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes(searchString)) {
          console.log(`Line ${i + 1}: ${line.trim()}`);
        }
      });
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
}

// Function to walk the directory recursively
function walkDir(dir, searchString, fileExt) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath, searchString, fileExt);
        } else if (path.extname(filePath) === fileExt) {
          searchInFile(filePath, searchString);
        }
      } catch (err) {
        console.error(`Error with file ${filePath}:`, err);
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
}

// Search for the given string in all .jsx files in the src directory
console.log('Searching for "reviewer"...');
walkDir(path.join(__dirname, 'src'), 'reviewer', '.jsx');

console.log('\nSearching for "Assigned Reviewers"...');
walkDir(path.join(__dirname, 'src'), 'Assigned Reviewers', '.jsx');

console.log('\nSearching for "must be assigned"...');
walkDir(path.join(__dirname, 'src'), 'must be assigned', '.jsx'); 