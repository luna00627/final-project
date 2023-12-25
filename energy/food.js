/*var XLSX = require("xlsx");
var woorkbook = XLSX.readFile("read_excel/table.xlsx");

let worksheet = workbook.Sheets[workbook.SheetNoames[0]];

for(let i=2; i<7; i++){
    const name = worksheet[`A${i}`].v;
    const size = worksheet[`B${i}`].v;
    const weight = worksheet[`C${i}`].v;
    const cal = worksheet[`D${i}`].v;

    console.log({
        name: name, size: size, weight: weight, cal: cal
    })
}*/

const ExcelJS = require('exceljs');

// 設定 Excel 文件的路徑
const excelFilePath = 'C:/Users/USER/sign in/energy/read_excel/table.xlsx'; // 使用單斜線或雙斜線皆可"C:\Users\USER\sign in\

const readExcel = async () => {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(excelFilePath);

    // 假設你的數據在第一個工作表中
    const worksheet = workbook.getWorksheet(1);

    // 定義一個空陣列來存儲數據
    const data = [];

    // 遍歷每一行
    worksheet.eachRow((row, rowNumber) => {
      // 假設第一行是表頭，從第二行開始讀取數據
      if (rowNumber > 1) {
        const rowData = {
          主食: row.getCell(1).text,
          蛋白質: row.getCell(2).text,
          蔬菜: row.getCell(3).text,
          水果: row.getCell(4).text,
          熱量: row.getCell(5).text,
          
        };
        data.push(rowData);
      }
    });

    // 輸出整理後的數據
    console.log(data);
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
  }
};

// 執行函式
readExcel();
