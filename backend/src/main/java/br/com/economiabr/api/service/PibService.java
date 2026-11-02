package br.com.economiabr.api.service;

import br.com.economiabr.api.client.PibClient;
import br.com.economiabr.api.dto.PibResponse;

import tools.jackson.databind.JsonNode;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PibService {

    private final PibClient pibClient;

    public PibService(PibClient pibClient) {
        this.pibClient = pibClient;
    }

    public List<PibResponse> buscarHistorico() {

        JsonNode nominalResposta = pibClient.buscarPibNominal();
        JsonNode crescimentoResposta = pibClient.buscarCrescimentoPib();

        Map<String, Double> valoresNominais = extrairSerie(nominalResposta);
        Map<String, Double> crescimentos = extrairSerie(crescimentoResposta);

        List<PibResponse> historico = new ArrayList<>();

        for (Map.Entry<String, Double> entrada : valoresNominais.entrySet()) {

            String periodo = entrada.getKey();

            if (!crescimentos.containsKey(periodo)) {
                continue;
            }

            double valorNominal = entrada.getValue();
            double crescimento = crescimentos.get(periodo);

            String periodoFormatado = formatarPeriodo(periodo);

            historico.add(new PibResponse(
                    periodo,
                    periodoFormatado,
                    valorNominal,
                    "Milhões de R$",
                    crescimento,
                    "%",
                    "IBGE/SIDRA - Tabelas 1846 e 5932"
            ));
        }

        historico.sort((a, b) ->
                b.periodo().compareTo(a.periodo())
        );

        return historico;
    }

    private Map<String, Double> extrairSerie(JsonNode resposta) {

        Map<String, Double> valores = new HashMap<>();

        JsonNode resultados = resposta.path(0).path("resultados");

        if (!resultados.isArray() || resultados.isEmpty()) {
            throw new IllegalStateException(
                    "O IBGE não retornou dados para o PIB."
            );
        }

        JsonNode series = resultados.get(0).path("series");

        if (!series.isArray() || series.isEmpty()) {
            throw new IllegalStateException(
                    "Não foi encontrada a série histórica do PIB."
            );
        }

        JsonNode serie = series.get(0).path("serie");

        serie.properties().forEach(campo -> {

            String periodo = campo.getKey();
            String valorOriginal = campo.getValue().asText();

            if (valorOriginal.isBlank() || valorOriginal.equals("..")) {
                return;
            }

            valores.put(
                    periodo,
                    Double.parseDouble(valorOriginal.replace(",", "."))
            );
        });

        return valores;
    }


    private String formatarPeriodo(String periodo) {

        if (periodo == null || periodo.length() != 6) {
            return periodo;
        }

        String ano = periodo.substring(0, 4);
        String trimestre = periodo.substring(4, 6);

        return switch (trimestre) {
            case "01" -> "1º trimestre de " + ano;
            case "02" -> "2º trimestre de " + ano;
            case "03" -> "3º trimestre de " + ano;
            case "04" -> "4º trimestre de " + ano;
            default -> periodo;
        };
    }
}

