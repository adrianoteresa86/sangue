export class FormatarData {
  static formatarData(data: Date | string): string {
    if (!data) return 'N/A';
    
    const dataObj = data instanceof Date ? data : new Date(data);
    
    // Verificar se a data é válida
    if (isNaN(dataObj.getTime())) return 'Data inválida';
    
    // Formatar para dd/mm/yyyy
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  }
  
  static formatarDataCompleta(data: Date | string): string {
    if (!data) return 'N/A';
    
    const dataObj = data instanceof Date ? data : new Date(data);
    
    // Verificar se a data é válida
    if (isNaN(dataObj.getTime())) return 'Data inválida';
    
    // Formatar para dd/mm/yyyy HH:mm
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    const horas = String(dataObj.getHours()).padStart(2, '0');
    const minutos = String(dataObj.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  }
  
  static calcularDiasParaVencer(dataValidade: Date | string): number {
    if (!dataValidade) return 0;
    
    const dataObj = dataValidade instanceof Date ? dataValidade : new Date(dataValidade);
    const agora = new Date();
    
    return Math.ceil((dataObj.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  static formatarDiasParaVencer(dataValidade: Date | string): string {
    const dias = this.calcularDiasParaVencer(dataValidade);
    
    if (dias < 0) {
      return `Venceu há ${Math.abs(dias)} dias`;
    } else if (dias === 0) {
      return 'Vence hoje';
    } else if (dias === 1) {
      return 'Vence amanhã';
    } else if (dias <= 7) {
      return `Vence em ${dias} dias`;
    } else if (dias <= 30) {
      return `Vence em ${dias} dias`;
    } else {
      return `Vence em ${dias} dias`;
    }
  }
}
