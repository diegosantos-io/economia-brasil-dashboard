package br.com.economiabr.api.dto;

public record IpcaResponse(
        String periodo,
        String periodoFormatado,
        String indicador,
        double valor,
        String unidade,
        String fonte
) {
}