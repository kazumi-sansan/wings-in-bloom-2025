import PDFBook from './components/PDFBook';
import './App.css';

function App() {
  const pdfFiles = Array.from({ length: 24 }, (_, i) => `/${i + 1}.png`);

  return (
    <div className="App">
      <PDFBook pngFiles={pdfFiles} />
    </div>
  );
}

export default App;
