package br.com.economiabr.api.service;

import br.com.economiabr.api.client.BancoCentralClient;
import br.com.economiabr.api.dto.CambioResponse;

import tools.jackson.databind.JsonNode;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CambioService {

    private final BancoCentralClient bancoCentralClient;

    public CambioService(BancoCentralClient bancoCentralClient) {
        this.bancoCentralClient = bancoCentralClient;
    }

    public List<CambioResponse> buscarHistorico(int dias) {

        JsonNode vendaResposta = bancoCentralClient.buscarCambio(dias);
        JsonNode compraResposta = bancoCentralClient.buscarCambioCompra(dias);

        Map<String, Double> vendas = extrairSerie(vendaResposta);
        Map<String, Double> compras = extrairSerie(compraResposta);

        List<CambioResponse> historico = new ArrayList<>();

        for (Map.Entry<String, Double> entrada : vendas.entrySet()) {

            String data = entrada.getKey();

            if (!compras.containsKey(data)) {
                continue;
            }

            historico.add(new CambioResponse(
                    data,
                    compras.get(data),
                    entrada.getValue(),
                    "USD/BRL",
                    "Banco Central do Brasil"
            ));
        }

        historico.sort((a, b) ->
                b.data().compareTo(a.data())
        );

        return historico;
    }

    private Map<String, Double> extrairSerie(JsonNode resposta) {

        Map<String, Double> valores = new HashMap<>();

        if (resposta == null || !resposta.isArray()) {
            throw new IllegalStateException(
                    "O Banco Central não retornou dados do câmbio."
            );
        }

        for (JsonNode registro : resposta) {

            String data = registro.path("data").asText();
            String valorOriginal = registro.path("valor").asText();

            if (data.isBlank() || valorOriginal.isBlank()) {
                continue;
            }

            valores.put(
                    data,
                    Double.parseDouble(valorOriginal.replace(",", "."))
            );
        }

        return valores;
    }
}